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
	EnvVarDbUsername     = "STM_DB_USERNAME"
	EnvVarDbPassword     = "STM_DB_PASSWORD"
	EnvVarDbHost         = "STM_DB_HOST"
	EnvVarOAuth2ClientId = "STM_OAUTH2_CLIENT_ID"
	EnvVarOAuth2Secret   = "STM_OAUTH2_SECRET"

	DefaultTokenInvalidityDuration = "24h"
	DefaultDbUsername              = "stm"
	DefaultDbPassword              = "secret"
	DefaultDbHost                  = "localhost"
	DefaultMaxTaskPerProject       = 1000
	DefaultMaxDescriptionLength    = 1000
	DefaultTestEnvironment         = false
)

type Config struct {
	// Can be set via config file:
	ServerUrl             string `json:"server-url"`
	Port                  int    `json:"port"`
	ClientAuthRedirectUrl string `json:"client-auth-redirect-url"`
	SslCertFile           string `json:"ssl-cert-file"`
	SslKeyFile            string `json:"ssl-key-file"`
	OsmBaseUrl            string `json:"osm-base-url"`
	DebugLogging          bool   `json:"debug-logging"`
	TokenValidityDuration string `json:"token-validity"`
	SourceRepoURL         string `json:"source-repo-url"`
	MaxTasksPerProject    int    `json:"max-task-per-project"`   // Maximum amount of tasks allowed for a project.
	MaxDescriptionLength  int    `json:"max-description-length"` // Maximum length for the project description in characters.
	TestEnvironment       bool   `json:"test-env"`

	// Can only be set via environment variables:
	DbUsername string `json:"-"`
	DbPassword string `json:"-"`
	DbHost     string `json:"-"`

	Oauth2ClientId string `json:"-"`
	Oauth2Secret   string `json:"-"`
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

	// OSM Oauth2 configs
	oauth2ClientId, ok := os.LookupEnv(EnvVarOAuth2ClientId)
	if len(oauth2ClientId) == 0 || !ok {
		sigolo.Error("Environment variable %s for the database user not set and no default value will be used.", EnvVarOAuth2ClientId)
	} else {
		Conf.Oauth2ClientId = oauth2ClientId
	}

	oauth2Secret, ok := os.LookupEnv(EnvVarOAuth2Secret)
	if len(oauth2Secret) == 0 || !ok {
		sigolo.Error("Environment variable %s for the database user not set and no default value will be used.", EnvVarOAuth2Secret)
	} else {
		Conf.Oauth2Secret = oauth2Secret
	}

	// Database configs
	dbUsername, ok := os.LookupEnv(EnvVarDbUsername)
	if len(dbUsername) == 0 || !ok {
		sigolo.Info("Environment variable %s for the database user not set. Use default '%s' instead.", EnvVarDbUsername, DefaultDbUsername)
	} else {
		Conf.DbUsername = dbUsername
	}

	dbPassword, ok := os.LookupEnv(EnvVarDbPassword)
	if len(dbUsername) == 0 || !ok {
		sigolo.Info("Environment variable %s for the database user not set. Use default '%s' instead.", EnvVarDbPassword, DefaultDbPassword)
	} else {
		Conf.DbPassword = dbPassword
	}

	dbHost, ok := os.LookupEnv(EnvVarDbHost)
	if len(dbHost) == 0 || !ok {
		sigolo.Info("Environment variable %s for the database user not set. Use default '%s' instead.", EnvVarDbHost, DefaultDbHost)
	} else {
		Conf.DbHost = dbHost
	}
}

func InitDefaultConfig() {
	Conf = &Config{}
	Conf.TokenValidityDuration = DefaultTokenInvalidityDuration
	Conf.DbUsername = DefaultDbUsername
	Conf.DbPassword = DefaultDbPassword
	Conf.DbHost = DefaultDbHost
	Conf.MaxTasksPerProject = DefaultMaxTaskPerProject
	Conf.MaxDescriptionLength = DefaultMaxDescriptionLength
	Conf.TestEnvironment = DefaultTestEnvironment
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
