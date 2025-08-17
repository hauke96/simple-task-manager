package config

import (
	"encoding/json"
	"fmt"
	"os"
	"reflect"
	"strconv"
	"strings"

	"github.com/hauke96/sigolo"
)

var (
	Conf *Config
)

const (
	EnvVarServerUrl             = "STM_SERVER_URL"
	EnvVarPort                  = "STM_PORT"
	EnvVarClientAuthRedirectUrl = "STM_CLIENT_AUTH_REDIRECT_URL"
	EnvVarOsmBaseUrl            = "STM_OSM_BASE_URL"
	EnvVarOsmApiUrl             = "STM_OSM_API_URL"
	EnvVarTokenValidityDuration = "STM_TOKEN_VALIDITY_DURATION"
	EnvVarSourceRepoURL         = "STM_SOURCE_REPO_URL"
	EnvVarMaxTasksPerProject    = "STM_MAX_TASKS_PER_PROJECT"
	EnvVarMaxDescriptionLength  = "STM_MAX_DESCRIPTION_LENGTH"
	EnvVarMaxCommentLength      = "STM_MAX_COMMENT_LENGTH"

	EnvVarSslCertFile = "STM_SSL_CERT_FILE"
	EnvVarSslKeyFile  = "STM_SSL_KEY_FILE"

	EnvVarDbUsername = "STM_DB_USERNAME"
	EnvVarDbPassword = "STM_DB_PASSWORD"
	EnvVarDbHost     = "STM_DB_HOST"
	EnvVarDbDatabase = "STM_DB_DATABASE"

	EnvVarOAuth2ClientId = "STM_OAUTH2_CLIENT_ID"
	EnvVarOAuth2Secret   = "STM_OAUTH2_SECRET"

	EnvVarDebugLogging    = "STM_DEBUG_LOGGING"
	EnvVarTestEnvironment = "STM_TEST_ENVIRONMENT"
)

const (
	DefaultPort                    = 8080
	DefaultSourceRepoUrl           = "https://github.com/hauke96/simple-task-manager"
	DefaultOsmBaseUrl              = "https://www.openstreetmap.org"
	DefaultOsmApiUrl               = "https://api.openstreetmap.org/api/0.6"
	DefaultTokenInvalidityDuration = "168h"
	DefaultMaxTaskPerProject       = 1000
	DefaultMaxDescriptionLength    = 1000
	DefaultMaxCommentLength        = 1000

	DefaultDbUsername = "stm"
	DefaultDbPassword = "secret"
	DefaultDbHost     = "localhost"
	DefaultDbDatabase = "stm"

	DefaultDebugLogging    = false
	DefaultTestEnvironment = false
)

type Config struct {
	ServerUrl             string `json:"server-url"`
	Port                  int    `json:"port"`
	ClientAuthRedirectUrl string `json:"client-auth-redirect-url"`
	OsmBaseUrl            string `json:"osm-base-url"`
	OsmApiUrl             string `json:"osm-api-url"`
	TokenValidityDuration string `json:"token-validity"`
	SourceRepoURL         string `json:"source-repo-url"`
	MaxTasksPerProject    int    `json:"max-task-per-project"`   // Maximum amount of tasks allowed for a project.
	MaxDescriptionLength  int    `json:"max-description-length"` // Maximum length for the project description in characters.
	MaxCommentLength      int    `json:"max-comment-length"`     // Maximum length for comments in characters.

	SslCertFile string `json:"ssl-cert-file"`
	SslKeyFile  string `json:"ssl-key-file"`

	DbUsername string `json:"db-username"`
	DbPassword string `json:"db-password"`
	DbHost     string `json:"db-host"`
	DbDatabase string `json:"db-database"`

	Oauth2ClientId string `json:"oauth2-client-id"`
	Oauth2Secret   string `json:"oauth2-secret"`

	DebugLogging    bool `json:"debug-logging"`
	TestEnvironment bool `json:"test-env"`
}

func LoadConfig(file string) {
	sigolo.Info("Use config file '%s'", file)

	initDefaultConfig()

	fileContent, err := os.ReadFile(file)
	if err != nil {
		sigolo.FatalCheck(err)
	}

	err = json.Unmarshal(fileContent, Conf)
	if err != nil {
		sigolo.FatalCheck(err)
	}

	// General configs
	Conf.ServerUrl = strings.TrimRight(getConfigEntry(EnvVarServerUrl, Conf.ServerUrl), "/")
	Conf.Port = getConfigEntryInt(EnvVarPort, Conf.Port)
	Conf.ClientAuthRedirectUrl = getConfigEntry(EnvVarClientAuthRedirectUrl, Conf.ClientAuthRedirectUrl)
	Conf.OsmBaseUrl = getConfigEntry(EnvVarOsmBaseUrl, Conf.OsmBaseUrl)
	Conf.OsmApiUrl = getConfigEntry(EnvVarOsmApiUrl, Conf.OsmApiUrl)
	Conf.TokenValidityDuration = getConfigEntry(EnvVarTokenValidityDuration, Conf.TokenValidityDuration)
	Conf.SourceRepoURL = getConfigEntry(EnvVarSourceRepoURL, Conf.SourceRepoURL)
	Conf.MaxTasksPerProject = getConfigEntryInt(EnvVarMaxTasksPerProject, Conf.MaxTasksPerProject)
	Conf.MaxDescriptionLength = getConfigEntryInt(EnvVarMaxDescriptionLength, Conf.MaxDescriptionLength)
	Conf.MaxCommentLength = getConfigEntryInt(EnvVarMaxCommentLength, Conf.MaxCommentLength)

	// SSL configs
	Conf.SslCertFile = getConfigEntry(EnvVarSslCertFile, Conf.SslCertFile)
	Conf.SslKeyFile = getConfigEntry(EnvVarSslKeyFile, Conf.SslKeyFile)

	// OSM Oauth2 configs
	Conf.Oauth2ClientId = getConfigEntry(EnvVarOAuth2ClientId, Conf.Oauth2ClientId)
	Conf.Oauth2Secret = getConfigEntry(EnvVarOAuth2Secret, Conf.Oauth2Secret)

	// Database configs
	Conf.DbUsername = getConfigEntry(EnvVarDbUsername, Conf.DbUsername)
	Conf.DbPassword = getConfigEntry(EnvVarDbPassword, Conf.DbPassword)
	Conf.DbHost = getConfigEntry(EnvVarDbHost, Conf.DbHost)
	Conf.DbDatabase = getConfigEntry(EnvVarDbDatabase, Conf.DbDatabase)

	// Misc
	Conf.DebugLogging = getConfigEntryBool(EnvVarDebugLogging, Conf.DebugLogging)
	Conf.TestEnvironment = getConfigEntryBool(EnvVarTestEnvironment, Conf.TestEnvironment)

	// Verify that all required configs entries exist
	verifyRequiredConfigFields()
}

func initDefaultConfig() {
	Conf = &Config{}

	Conf.Port = DefaultPort
	Conf.OsmBaseUrl = DefaultOsmBaseUrl
	Conf.OsmApiUrl = DefaultOsmApiUrl
	Conf.TokenValidityDuration = DefaultTokenInvalidityDuration
	Conf.SourceRepoURL = DefaultSourceRepoUrl
	Conf.MaxTasksPerProject = DefaultMaxTaskPerProject
	Conf.MaxDescriptionLength = DefaultMaxDescriptionLength
	Conf.MaxCommentLength = DefaultMaxCommentLength

	Conf.DbUsername = DefaultDbUsername
	Conf.DbPassword = DefaultDbPassword
	Conf.DbHost = DefaultDbHost
	Conf.DbDatabase = DefaultDbDatabase

	Conf.DebugLogging = DefaultDebugLogging
	Conf.TestEnvironment = DefaultTestEnvironment
}

func verifyRequiredConfigFields() {
	hasMissingConfigs := false

	// Basic server things
	if Conf.ServerUrl == "" {
		sigolo.Error("Config entry missing: Server URL (config entry '%s' or environment variable '%s')", getTagValue("ServerUrl"), EnvVarServerUrl)
		hasMissingConfigs = true
	}
	if Conf.Port == 0 {
		sigolo.Error("Config entry missing: Server port (config entry '%s' or environment variable '%s')", getTagValue("Port"), EnvVarPort)
		hasMissingConfigs = true
	}
	if Conf.ClientAuthRedirectUrl == "" {
		sigolo.Error("Config entry missing:  (config entry '%s' or environment variable '%s')", getTagValue("ClientAuthRedirectUrl"), EnvVarClientAuthRedirectUrl)
		hasMissingConfigs = true
	}
	if Conf.OsmBaseUrl == "" {
		sigolo.Error("Config entry missing:  (config entry '%s' or environment variable '%s')", getTagValue("OsmBaseUrl"), EnvVarOsmBaseUrl)
		hasMissingConfigs = true
	}
	if Conf.OsmApiUrl == "" {
		sigolo.Error("Config entry missing:  (config entry '%s' or environment variable '%s')", getTagValue("OsmApiUrl"), EnvVarOsmApiUrl)
		hasMissingConfigs = true
	}

	// OAuth
	if Conf.Oauth2ClientId == "" {
		sigolo.Error("Config entry missing: OAuth2 client ID (config entry '%s' or environment variable '%s')", getTagValue("Oauth2ClientId"), EnvVarOAuth2ClientId)
		hasMissingConfigs = true
	}
	if Conf.Oauth2Secret == "" {
		sigolo.Error("Config entry missing: OAuth2 client secret (config entry '%s' or environment variable '%s')", getTagValue("Oauth2Secret"), EnvVarOAuth2Secret)
		hasMissingConfigs = true
	}

	// Database
	if Conf.DbPassword == "" {
		sigolo.Error("Config entry missing: Database password (config entry '%s' or environment variable '%s')", getTagValue("DbPassword"), EnvVarDbPassword)
		hasMissingConfigs = true
	}
	if Conf.DbUsername == "" {
		sigolo.Error("Config entry missing: Database username (config entry '%s' or environment variable '%s')", getTagValue("DbUsername"), EnvVarDbUsername)
		hasMissingConfigs = true
	}
	if Conf.DbHost == "" {
		sigolo.Error("Config entry missing: Database host (config entry '%s' or environment variable '%s')", getTagValue("DbHost"), EnvVarDbHost)
		hasMissingConfigs = true
	}
	if Conf.DbDatabase == "" {
		sigolo.Error("Config entry missing: Database name (config entry '%s' or environment variable '%s')", getTagValue("DbDatabase"), EnvVarDbDatabase)
		hasMissingConfigs = true
	}

	if hasMissingConfigs {
		sigolo.Fatal("Config entries incomplete.")
	}
}

func getConfigEntry(envVariableName string, fallback string) string {
	value, ok := os.LookupEnv(envVariableName)
	if len(value) == 0 || !ok {
		sigolo.Debug("Environment variable %s not set. Fallback value from config will be used.", envVariableName)
		return fallback
	}

	return value
}

func getConfigEntryInt(envVariableName string, fallback int) int {
	value, ok := os.LookupEnv(envVariableName)
	if len(value) == 0 || !ok {
		sigolo.Debug("Environment variable %s not set. Fallback value from config will be used.", envVariableName)
		return fallback
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		sigolo.Debug("Environment variable %s contains non-integer value. Fallback value from config will be used.", envVariableName)
		return fallback
	}

	return intValue
}

func getConfigEntryBool(envVariableName string, fallback bool) bool {
	value, ok := os.LookupEnv(envVariableName)
	if len(value) == 0 || !ok {
		sigolo.Debug("Environment variable %s not set. Fallback value from config will be used.", envVariableName)
		return fallback
	}

	boolValue, err := strconv.ParseBool(value)
	if err != nil {
		sigolo.Debug("Environment variable %s contains non-integer value. Fallback value from config will be used.", envVariableName)
		return fallback
	}

	return boolValue
}

func getTagValue(fieldName string) string {
	field, found := reflect.TypeOf(*Conf).FieldByName(fieldName)
	if !found {
		return "-"
	}
	return field.Tag.Get("json")
}

func (c Config) IsHttps() bool {
	return c.SslCertFile != "" && c.SslKeyFile != ""
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
		if propertyName == "DbPassword" || propertyName == "Oauth2Secret" {
			propertyValue = "******" // don't show passwords etc. in the logs
		} else {
			propertyValue = strings.Join(strings.Split(p, ":")[1:], ":") // Join remaining parts back together
		}

		sigolo.Info("  %-*s = %s", 21, propertyName, propertyValue)
	}
}
