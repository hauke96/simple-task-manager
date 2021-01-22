package config

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strings"

	"github.com/hauke96/sigolo"
)

var (
	Conf *Config
)

type Config struct {
	ServerUrl             string `json:"server-url"`
	Port                  int    `json:"port"`
	SslCertFile           string `json:"ssl-cert-file"`
	SslKeyFile            string `json:"ssl-key-file"`
	OauthConsumerKey      string
	OauthSecret           string
	OsmBaseUrl            string `json:"osm-base-url"`
	DebugLogging          bool   `json:"debug-logging"`
	DbUsername            string
	DbPassword            string
	TokenValidityDuration string `json:"token-validity"`
	SourceRepoURL         string `json:"source-repo-url"`
	MaxTasksPerProject    int
}

func LoadConfig(file string) {
	sigolo.Info("Use config file '%s'", file)

	fileContent, err := ioutil.ReadFile(file)
	if err != nil {
		sigolo.FatalCheck(err)
	}

	Conf = &Config{}
	Conf.TokenValidityDuration = "24h"

	err = json.Unmarshal([]byte(fileContent), Conf)
	if err != nil {
		sigolo.FatalCheck(err)
	}

	// OSM Oauth configs
	oauthConsumerKey, _ := os.LookupEnv("OAUTH_CONSUMER_KEY")
	oauthSecret, _ := os.LookupEnv("OAUTH_SECRET")
	Conf.OauthConsumerKey = oauthConsumerKey
	Conf.OauthSecret = oauthSecret

	// Database configs
	DbUsernameEnvVar := "STM_DB_USERNAME"
	DbPasswordEnvVar := "STM_DB_PASSWORD"
	DbUsernameDefault := "postgres"
	DbPasswordDefault := "geheim"

	dbUsername, ok := os.LookupEnv(DbUsernameEnvVar)
	if len(dbUsername) == 0 || !ok {
		sigolo.Info("Environment variable %s for the database user not set. Fallback to default: %s", DbUsernameEnvVar, DbUsernameDefault)
		dbUsername = DbUsernameDefault
	}
	dbPassword, _ := os.LookupEnv(DbPasswordEnvVar)
	if len(dbUsername) == 0 || !ok {
		sigolo.Info("Environment variable %s for the database user not set. Fallback to default: %s", DbPasswordEnvVar, DbPasswordDefault)
		dbPassword = DbPasswordDefault
	}

	// TODO extract into config (s. GitHub issue https://github.com/hauke96/simple-task-manager/issues/133)
	Conf.MaxTasksPerProject = 1000

	Conf.DbUsername = dbUsername
	Conf.DbPassword = dbPassword
}

func PrintConfig() {
	// Parse config struct to print it:
	wholeConfStr := fmt.Sprintf("%#v", Conf)                      // -> "main.Config{Serve...}"
	splitConfStr := strings.Split(wholeConfStr, "{")              // --> "main.Config" and "Serve...}"
	propertyString := splitConfStr[1][0 : len(splitConfStr[1])-1] // cut last "}" off
	propertyList := strings.Split(propertyString, ", ")

	sigolo.Info("Config:")
	for _, p := range propertyList {
		propertyName := strings.Split(p, ":")[0]

		var propertyValue string
		if propertyName == "DbPassword" || propertyName == "OauthSecret" {
			propertyValue = "******" // don't show passwords etc. in the logs
		} else {
			propertyValue = strings.Join(strings.Split(p, ":")[1:], ":") // Join remaining parts back together
		}

		sigolo.Info("  %-*s = %s", 21, propertyName, propertyValue)
	}
}
