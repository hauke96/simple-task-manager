package oauth2

import (
	"context"
	"encoding/xml"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/pkg/errors"
	"golang.org/x/oauth2"
	"io"
	"net/http"
	"stm/config"
	"stm/util"
	"time"
)

var (
	oauth2Config          *oauth2.Config
	osmUserDetailsUrl     string
	tokenValidityDuration time.Duration

	loggers map[string]*util.Logger
)

func Init() {
	err := tokenInit()
	sigolo.FatalCheck(err)

	oauth2Config = &oauth2.Config{
		RedirectURL:  fmt.Sprintf("%s:%d/oauth2/callback", config.Conf.ServerUrl, config.Conf.Port),
		ClientID:     config.Conf.Oauth2ClientId,
		ClientSecret: config.Conf.Oauth2Secret,
		Scopes:       []string{"read_prefs", "openid"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  config.Conf.OsmBaseUrl + "/oauth2/authorize",
			TokenURL: config.Conf.OsmBaseUrl + "/oauth2/token",
		},
	}

	osmUserDetailsUrl = config.Conf.OsmBaseUrl + "/api/0.6/user/details"

	tokenValidityDuration, err = time.ParseDuration(config.Conf.TokenValidityDuration)
	sigolo.FatalCheckf(err, "Unable to parse token validity duration from config entry '%s'", config.Conf.TokenValidityDuration)

	loggers = make(map[string]*util.Logger)
}

func Login(w http.ResponseWriter, r *http.Request) {
	logger := util.NewLogger()
	logger.Debug("OAuth2 login called")

	configKey, err := util.GetRandomString()
	if err != nil {
		logger.Stack(err)
		util.ResponseInternalError(w, logger, errors.New("Could not get random string for config key"))
		return
	}
	loggers[configKey] = logger
	url := oauth2Config.AuthCodeURL(configKey)

	logger.Debug("Redirect to URL: %s", url)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func Callback(w http.ResponseWriter, r *http.Request) {
	sigolo.Debug("OAuth2 callback called")

	sigolo.Debug("Recover state")
	configKey, err := util.GetParam("state", r)
	if err != nil {
		logger := util.NewLogger()
		logger.Err("Could not load config key from request URL")
		logger.Stack(err)
		util.ResponseBadRequest(w, logger, err)
		return
	}

	// Get the logger for this login process and remove its entry since we don't need it anymore
	sigolo.Debug("Recover logger")
	logger, ok := loggers[configKey]
	loggers[configKey] = nil
	if !ok || logger == nil {
		err := errors.New(fmt.Sprintf("Logger for config key %s not found", configKey))
		logger := util.NewLogger()
		logger.Stack(err)
		util.ResponseBadRequest(w, logger, err)
		return
	}

	logger.Debug("Perform exchange operation to obtain access token")
	osmApiToken, err := oauth2Config.Exchange(context.Background(), r.FormValue("code"))
	if err != nil {
		logger.Err("Unable to perform OAuth2 Exchange: %s", err.Error())
		return
	}

	logger.Debug("Request user information")
	userName, userId, err := requestUserInformation(osmApiToken.AccessToken)
	if err != nil {
		logger.Err("Unable to get user-info: %s", err.Error())
		return
	}

	// Until here, the user is considered to be successfully logged in. Now we can create the token used to authenticate
	// against this server.

	logger.Log("Create token for user '%s'", userName)

	validUntil := time.Now().Add(tokenValidityDuration).Unix()

	encodedTokenString, err := createTokenString(logger, userName, userId, validUntil)
	if err != nil {
		logger.Stack(err)
		util.ResponseInternalError(w, logger, err)
		return
	}

	// This redirects to the landing page of the web-client. The client then stores the token and uses it for later
	// requests.
	http.Redirect(w, r, config.Conf.ClientAuthRedirectUrl+"?token="+encodedTokenString, http.StatusTemporaryRedirect)
}

func requestUserInformation(token string) (string, string, error) {
	req, err := http.NewRequest("GET", osmUserDetailsUrl, nil)
	if err != nil {
		return "", "", errors.Wrap(err, "Creating request user information failed")
	}

	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	response, err := client.Do(req)
	if err != nil {
		return "", "", errors.Wrap(err, "Requesting user information failed")
	}

	responseBody, err := io.ReadAll(response.Body)
	defer response.Body.Close()
	if err != nil {
		return "", "", errors.Wrap(err, "Could not get response body")
	}

	var osm Osm
	err = xml.Unmarshal(responseBody, &osm)
	if err != nil {
		return "", "", errors.New(fmt.Sprintf("Could not unmarshal user-info response.\nResponse Body: %s\nUnmarshalling Error: %s", responseBody, err.Error()))
	}

	return osm.User.DisplayName, osm.User.UserId, nil
}

// VerifyRequest checks the integrity of the token and the "validUntil" date. It then returns the token but without the
// secret part, just the meta information (e.g. user name) is set.
func VerifyRequest(r *http.Request, logger *util.Logger) (*Token, error) {
	encodedToken := r.Header.Get("Authorization")

	token, err := verifyToken(logger, encodedToken)
	if err != nil {
		return nil, err
	}

	logger.Debug("User '%s' has valid token", token.User)

	token.Secret = ""
	return token, nil
}
