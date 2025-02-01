package config

import (
	"fmt"
	"github.com/pkg/errors"
	"testing"
)

func TestInitConfig(t *testing.T) {
	h.Run(t, func() error {
		initDefaultConfig()

		if Conf.ServerUrl != "" {
			return errors.New(fmt.Sprintf("Default value of 'ServerUrl' wrong: Wanted %s but was %s", "''", Conf.ServerUrl))
		}
		if Conf.ClientAuthRedirectUrl != "" {
			return errors.New(fmt.Sprintf("Default value of 'ClientAuthRedirectUrl' wrong: Wanted %s but was %s", "''", Conf.ClientAuthRedirectUrl))
		}

		if Conf.SslCertFile != "" {
			return errors.New(fmt.Sprintf("Default value of 'SslCertFile' wrong: Wanted %s but was %s", "''", Conf.SslCertFile))
		}
		if Conf.SslKeyFile != "" {
			return errors.New(fmt.Sprintf("Default value of 'SslKeyFile' wrong: Wanted %s but was %s", "''", Conf.SslKeyFile))
		}

		if Conf.Oauth2ClientId != "" {
			return errors.New(fmt.Sprintf("Default value of 'Oauth2ClientId' wrong: Wanted %s but was %s", "''", Conf.Oauth2ClientId))
		}
		if Conf.Oauth2Secret != "" {
			return errors.New(fmt.Sprintf("Default value of 'Oauth2Secret' wrong: Wanted %s but was %s", "''", Conf.Oauth2Secret))
		}

		// Properties with default values:

		if Conf.Port != DefaultPort {
			return errors.New(fmt.Sprintf("Default value of 'Port' wrong: Wanted %d but was %d", DefaultPort, Conf.Port))
		}
		if Conf.IsBehindProxy != DefaultIsBehindProxy {
			return errors.New(fmt.Sprintf("Default value of 'IsBehindProxy' wrong: Wanted %d but was %d", DefaultIsBehindProxy, Conf.IsBehindProxy))
		}
		if Conf.OsmBaseUrl != DefaultOsmBaseUrl {
			return errors.New(fmt.Sprintf("Default value of 'OsmBaseUrl' wrong: Wanted %s but was %s", DefaultOsmBaseUrl, Conf.OsmBaseUrl))
		}
		if Conf.OsmApiUrl != DefaultOsmApiUrl {
			return errors.New(fmt.Sprintf("Default value of 'OsmApiUrl' wrong: Wanted %s but was %s", DefaultOsmApiUrl, Conf.OsmApiUrl))
		}
		if Conf.TokenValidityDuration != DefaultTokenInvalidityDuration {
			return errors.New(fmt.Sprintf("Default value of 'TokenValidityDuration' wrong: Wanted %s but was %s", DefaultTokenInvalidityDuration, Conf.TokenValidityDuration))
		}
		if Conf.SourceRepoURL != DefaultSourceRepoUrl {
			return errors.New(fmt.Sprintf("Default value of 'SourceRepoURL' wrong: Wanted %s but was %s", DefaultSourceRepoUrl, Conf.SourceRepoURL))
		}
		if Conf.MaxTasksPerProject != DefaultMaxTaskPerProject {
			return errors.New(fmt.Sprintf("Default value of 'MaxTasksPerProject' wrong: Wanted %d but was %d", DefaultMaxTaskPerProject, Conf.MaxTasksPerProject))
		}
		if Conf.MaxDescriptionLength != DefaultMaxDescriptionLength {
			return errors.New(fmt.Sprintf("Default value of 'MaxDescriptionLength' wrong: Wanted %d but was %d", DefaultMaxDescriptionLength, Conf.MaxDescriptionLength))
		}

		if Conf.DbUsername != DefaultDbUsername {
			return errors.New(fmt.Sprintf("Default value of 'DbUsername' wrong: Wanted %s but was %s", DefaultDbUsername, Conf.DbUsername))
		}
		if Conf.DbPassword != DefaultDbPassword {
			return errors.New(fmt.Sprintf("Default value of 'DbPassword' wrong: Wanted %s but was %s", DefaultDbPassword, Conf.DbPassword))
		}
		if Conf.DbHost != DefaultDbHost {
			return errors.New(fmt.Sprintf("Default value of 'DbHost' wrong: Wanted %s but was %s", DefaultDbHost, Conf.DbHost))
		}
		if Conf.DbDatabase != DefaultDbDatabase {
			return errors.New(fmt.Sprintf("Default value of 'DbDatabase' wrong: Wanted %s but was %s", DefaultDbDatabase, Conf.DbDatabase))
		}

		if Conf.DebugLogging != DefaultDebugLogging {
			return errors.New(fmt.Sprintf("Default value of 'DebugLogging' wrong: Wanted %t but was %t", DefaultDebugLogging, Conf.DebugLogging))
		}
		if Conf.TestEnvironment != DefaultTestEnvironment {
			return errors.New(fmt.Sprintf("Default value of 'TestEnvironment' wrong: Wanted %t but was %t", DefaultTestEnvironment, Conf.TestEnvironment))
		}

		return nil
	})
}
