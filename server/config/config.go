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

const (
	EnvVarDbUsername       = "STM_DB_USERNAME"
	EnvVarDbPassword       = "STM_DB_PASSWORD"
	EnvVarOAuthConsumerKey = "OAUTH_CONSUMER_KEY"
	EnvVarOAuthSecret      = "OAUTH_SECRET"

	DefaultTokenInvalidityDuration = "24h"
	DefaultDbUsername              = "stm"
	DefaultDbPassword              = "secret"
	DefaultMaxTaskPerProject       = 1000
	DefaultMaxDescriptionLength    = 1000
)

type Config struct {
	// Can be set via config file:
	ServerUrl             string `json:"server-url"`
	Port                  int    `json:"port"`
	SslCertFile           string `json:"ssl-cert-file"`
	SslKeyFile            string `json:"ssl-key-file"`
	OsmBaseUrl            string `json:"osm-base-url"`
	DebugLogging          bool   `json:"debug-logging"`
	TokenValidityDuration string `json:"token-validity"`
	SourceRepoURL         string `json:"source-repo-url"`
	MaxTasksPerProject    int    `json:"max-task-per-project"`
	MaxDescriptionLength  int    `json:"max-description-length"` // Maximum length for the project description in characters. Default: 1000.

	// Can only be set via environment variables:
	DbUsername       string `json:"-"`
	DbPassword       string `json:"-"`
	OauthConsumerKey string `json:"-"`
	OauthSecret      string `json:"-"`
}

func LoadConfig(file string) {
	sigolo.Info("Use config file '%s'", file)

	InitDefaultConfig()

	fileContent, err := ioutil.ReadFile(file)
	if err != nil {
		sigolo.FatalCheck(err)
	}

	err = json.Unmarshal(fileContent, Conf)
	if err != nil {
		sigolo.FatalCheck(err)
	}

	// OSM Oauth configs
	oauthConsumerKey, _ := os.LookupEnv(EnvVarOAuthConsumerKey)
	oauthSecret, _ := os.LookupEnv(EnvVarOAuthSecret)
	Conf.OauthConsumerKey = oauthConsumerKey
	Conf.OauthSecret = oauthSecret

	// Database configs
	dbUsername, ok := os.LookupEnv(EnvVarDbUsername)
	if len(dbUsername) == 0 || !ok {
		sigolo.Info("Environment variable %s for the database user not set. Use default instead.", EnvVarDbUsername)
	} else {
		Conf.DbUsername = dbUsername
	}

	dbPassword, _ := os.LookupEnv(EnvVarDbPassword)
	if len(dbUsername) == 0 || !ok {
		sigolo.Info("Environment variable %s for the database user not set. Use default instead.", EnvVarDbPassword)
	} else {
		Conf.DbPassword = dbPassword
	}
}

func InitDefaultConfig() {
	Conf = &Config{}
	Conf.TokenValidityDuration = DefaultTokenInvalidityDuration
	Conf.DbUsername = DefaultDbUsername
	Conf.DbPassword = DefaultDbPassword
	Conf.MaxTasksPerProject = DefaultMaxTaskPerProject
	Conf.MaxDescriptionLength = DefaultMaxDescriptionLength
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
