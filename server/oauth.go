package main

import (
	"crypto/aes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"encoding/xml"
	"time"

	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/kurrik/oauth1a"

	"github.com/hauke96/sigolo"
)

var (
	oauthRedirectUrl  = "http://localhost:8080/oauth_callback"
	oauthConsumerKey  = "TWaSD2RpZbtxuV5reVZ7jOQNDGmPjDux2BGK3zUy"
	oauthSecret       = "a8K9wAU4Z8v8G7ayxnOpjnsLknkW72Txh62Nsu1C"
	oauthBaseUrl      = "https://master.apis.dev.openstreetmap.org"
	osmUserDetailsUrl = "https://master.apis.dev.openstreetmap.org/api/0.6/user/details"

	service = &oauth1a.Service{
		RequestURL:   oauthBaseUrl + "/oauth/request_token",
		AuthorizeURL: oauthBaseUrl + "/oauth/authorize",
		AccessURL:    oauthBaseUrl + "/oauth/access_token",
		ClientConfig: &oauth1a.ClientConfig{
			ConsumerKey:    oauthConsumerKey,
			ConsumerSecret: oauthSecret,
			CallbackURL:    oauthRedirectUrl,
		},
		Signer: new(oauth1a.HmacSha1Signer),
	}

	userConfig        *oauth1a.UserConfig
	clientRedirectUrl string
)

func oauthLogin(w http.ResponseWriter, r *http.Request) {
	userConfig = &oauth1a.UserConfig{}
	clientRedirectUrl = r.FormValue("redirect")

	httpClient := new(http.Client)
	err := userConfig.GetRequestToken(service, httpClient)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}

	url, err := userConfig.GetAuthorizeURL(service)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}

	sigolo.Debug("User config: %#v\n", userConfig)
	sigolo.Debug("Redirect to URL %s", url)

	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func oauthCallback(w http.ResponseWriter, r *http.Request) {
	sigolo.Info("Callback called")

	requestAccessToken(r, userConfig)

	userName, err := requestUserInformation(userConfig)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}

	sigolo.Info("Create token for user '%s'", userName)

	tokenValidDuration, _ := time.ParseDuration("1h") // 1 hour
	validUntil := time.Now().Add(tokenValidDuration).Unix()

	secret, err := createSecret(userName, validUntil)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}

	// Create actual token
	token := &Token{
		ValidUntil: validUntil,
		User:       userName,
		Secret:     secret,
	}

	sigolo.Debug("New token:\n%#v", token)

	jsonBytes, err := json.Marshal(token)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}

	encodedTokenString := base64.StdEncoding.EncodeToString(jsonBytes)

	http.Redirect(w, r, clientRedirectUrl+"?token="+encodedTokenString, http.StatusTemporaryRedirect)
}

func requestAccessToken(r *http.Request, userConfig *oauth1a.UserConfig) {
	token := r.FormValue("oauth_token")
	userConfig.AccessTokenSecret = token
	userConfig.Verifier = r.FormValue("oauth_verifier")

	// Redirect the user to <url> and parse out token and verifier from the response.
	sigolo.Debug("%#v", userConfig)
	httpClient := new(http.Client)
	err := userConfig.GetAccessToken(userConfig.RequestTokenKey, userConfig.Verifier, service, httpClient)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}
}

func requestUserInformation(userConfig *oauth1a.UserConfig) (string, error) {
	req, err := http.NewRequest("GET", osmUserDetailsUrl, nil)
	if err != nil {
		sigolo.Error("Requesting user information failed: %s", err.Error())
		return "", err
	}
	sigolo.Debug("Updates user config: %#v\n", userConfig)
	service.Sign(req, userConfig)

	client := &http.Client{}
	response, err := client.Do(req)
	if err != nil {
		sigolo.Error("Requesting user information failed: %s", err.Error())
		return "", err
	}

	responseBody, err := ioutil.ReadAll(response.Body)
	defer response.Body.Close()
	if err != nil {
		sigolo.Error("Could not get response body: %s", err.Error())
		return "", err
	}

	var osm Osm
	xml.Unmarshal(responseBody, &osm)

	return osm.User.DisplayName, nil
}

// createSecret builds a new secret string encoded as base64. The idea: Take a
// secret string, hash it (so disguise the length of this secret) and encrypt it.
// To have equal length secrets, hash it again.
func createSecret(user string, validTime int64) (string, error) {
	key := sha256.Sum256([]byte("some very secret key"))
	secretBaseString := fmt.Sprintf("%s%s%d", "abc123", user, validTime)
	secretHashedBytes := sha256.Sum256([]byte(secretBaseString))

	cipher, err := aes.NewCipher(key[:])
	if err != nil {
		sigolo.Error(err.Error())
		return "", err
	}

	secretEncryptedBytes := make([]byte, 32)
	cipher.Encrypt(secretEncryptedBytes, secretHashedBytes[:])

	secretEncryptedHashedBytes := sha256.Sum256([]byte(secretEncryptedBytes))

	return base64.StdEncoding.EncodeToString(secretEncryptedHashedBytes[:]), nil
}
