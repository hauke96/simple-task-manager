package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/xml"
	"github.com/pkg/errors"
	"time"

	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/hauke96/sigolo"
	"github.com/kurrik/oauth1a"

	"github.com/hauke96/simple-task-manager/server/config"
	"github.com/hauke96/simple-task-manager/server/util"
)

var (
	oauthRedirectUrl  string
	oauthConsumerKey  string
	oauthSecret       string
	oauthBaseUrl      string
	osmUserDetailsUrl string

	service *oauth1a.Service

	configs map[string]*oauth1a.UserConfig
)

func Init() {
	err := tokenInit()
	sigolo.FatalCheck(err)

	oauthRedirectUrl = fmt.Sprintf("%s:%d/oauth_callback", config.Conf.ServerUrl, config.Conf.Port)
	oauthConsumerKey = config.Conf.OauthConsumerKey
	oauthSecret = config.Conf.OauthSecret
	oauthBaseUrl = config.Conf.OsmBaseUrl
	osmUserDetailsUrl = config.Conf.OsmBaseUrl + "/api/0.6/user/details"

	service = &oauth1a.Service{
		RequestURL:   config.Conf.OsmBaseUrl + "/oauth/request_token",
		AuthorizeURL: config.Conf.OsmBaseUrl + "/oauth/authorize",
		AccessURL:    config.Conf.OsmBaseUrl + "/oauth/access_token",
		ClientConfig: &oauth1a.ClientConfig{
			ConsumerKey:    oauthConsumerKey,
			ConsumerSecret: oauthSecret,
			CallbackURL:    oauthRedirectUrl,
		},
		Signer: new(oauth1a.HmacSha1Signer),
	}

	configs = make(map[string]*oauth1a.UserConfig)
}

func OauthLogin(w http.ResponseWriter, r *http.Request) {
	userConfig := &oauth1a.UserConfig{}

	randomBytes, err := getRandomBytes(64)
	if err != nil {
		util.ResponseInternalError(w, fmt.Sprintf("Coulc not get random bytes for config key: %s", err.Error()))
		return
	}

	configKey := fmt.Sprintf("%x", sha256.Sum256(randomBytes))

	clientRedirectUrl, err := util.GetParam("redirect", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	// We add the config-param to the redirect URL in order to transfer the config key to the callback function. There
	// we use this key to retrieve the config back and be able to make proper requests to the OSM server..
	// The redirect param is the URL of the web application we want to redirect back to, after everything is done.
	service.ClientConfig.CallbackURL = oauthRedirectUrl + "?redirect=" + clientRedirectUrl + "&config=" + configKey
	sigolo.Info("%s", service.ClientConfig.CallbackURL)

	httpClient := new(http.Client)
	err = userConfig.GetRequestToken(service, httpClient)
	if err != nil {
		sigolo.Error("could not get request token from config: %s", err.Error())
		return
	}

	url, err := userConfig.GetAuthorizeURL(service)
	if err != nil {
		sigolo.Error("could not get authorization URL from config: %s", err.Error())
		return
	}

	sigolo.Debug("Redirect to URL: %s", url)

	configs[configKey] = userConfig
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func OauthCallback(w http.ResponseWriter, r *http.Request) {
	sigolo.Info("Callback called")

	configKey, err := util.GetParam("config", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	// Get the config where the request tokens are stored in. They are needed later to get some basic user information.
	userConfig, ok := configs[configKey]
	if !ok || userConfig == nil {
		util.ResponseBadRequest(w, "User config not found")
		return
	}
	configs[configKey] = nil // Remove the config, we don't need it  anymore

	// This gets the redirect URL of the web-client. So e.g. "https://stm-hauke-stieler.de/oauth-landing"
	clientRedirectUrl, err := util.GetParam("redirect", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	// Request access token from the OSM server in order to then get some user information.
	err = requestAccessToken(r, userConfig)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	userName, userId, err := requestUserInformation(userConfig)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	// Until here, the user is considered to be successfully logged in. Now we can create the token used to authenticate
	// against this server.

	sigolo.Info("Create token for user '%s'", userName)

	tokenValidDuration, _ := time.ParseDuration("24h")
	validUntil := time.Now().Add(tokenValidDuration).Unix()

	encodedTokenString, err := createTokenString(err, userName, userId, validUntil)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	// This redirects to the landing page of the web-client. The client then stores the token and uses it for later
	// requests.
	http.Redirect(w, r, clientRedirectUrl+"?token="+encodedTokenString, http.StatusTemporaryRedirect)
}

func requestAccessToken(r *http.Request, userConfig *oauth1a.UserConfig) error {
	token := r.FormValue("oauth_token")
	userConfig.AccessTokenSecret = token
	userConfig.Verifier = r.FormValue("oauth_verifier")

	httpClient := new(http.Client)
	return userConfig.GetAccessToken(userConfig.RequestTokenKey, userConfig.Verifier, service, httpClient)
}

func requestUserInformation(userConfig *oauth1a.UserConfig) (string, string, error) {
	req, err := http.NewRequest("GET", osmUserDetailsUrl, nil)
	if err != nil {
		return "", "", errors.Wrap(err, "Creating request user information failed")
	}

	// The OSM server expects a signed request
	err = service.Sign(req, userConfig)
	if err != nil {
		return "", "", errors.Wrap(err, "Signing request failed")
	}

	client := &http.Client{}
	response, err := client.Do(req)
	if err != nil {
		return "", "", errors.Wrap(err, "Requesting user information failed")
	}

	responseBody, err := ioutil.ReadAll(response.Body)
	defer response.Body.Close()
	if err != nil {
		return "", "", errors.Wrap(err, "Could not get response body")
	}

	var osm util.Osm
	xml.Unmarshal(responseBody, &osm)

	return osm.User.DisplayName, osm.User.UserId, nil
}

func getRandomBytes(count int) ([]byte, error) {
	bytes := make([]byte, count)

	n, err := rand.Read(bytes)

	if n != count {
		return nil, errors.New(fmt.Sprintf("Could not read all %d random bytes", count))
	}
	if err != nil {
		return nil, errors.Wrap(err, "Unable to read random bytes")
	}

	return bytes, nil
}

// verifyRequest checks the integrity of the token and the "validUntil" date. It
// then returns the token but without the secret part, just the meta information
// (e.g. user name) is set.
func VerifyRequest(r *http.Request) (*Token, error) {
	encodedToken := r.Header.Get("Authorization")

	token, err := verifyToken(encodedToken)
	if err != nil {
		return nil, err
	}

	sigolo.Debug("User '%s' has valid token", token.User)

	token.Secret = ""
	return token, nil
}
