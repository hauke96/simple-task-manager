package config

import (
	"fmt"
	"github.com/pkg/errors"
	"testing"
)

func TestInitConfig(t *testing.T) {
	h.Run(t, func() error {
		initDefaultConfig()

		if Conf.DebugLogging {
			return errors.New(fmt.Sprintf("Default value of 'DebugLogging' wrong: Wanted %s but was %v", "false", Conf.DebugLogging))
		}
		if Conf.SourceRepoURL != "" {
			return errors.New(fmt.Sprintf("Default value of 'SourceRepoURL' wrong: Wanted %s but was %s", "''", Conf.SourceRepoURL))
		}
		if Conf.Port != 0 {
			return errors.New(fmt.Sprintf("Default value of 'Port' wrong: Wanted %d but was %d", 0, Conf.Port))
		}
		if Conf.ServerUrl != "" {
			return errors.New(fmt.Sprintf("Default value of 'ServerUrl' wrong: Wanted %s but was %s", "''", Conf.ServerUrl))
		}
		if Conf.Oauth2ClientId != "" {
			return errors.New(fmt.Sprintf("Default value of 'Oauth2ClientId' wrong: Wanted %s but was %s", "''", Conf.Oauth2ClientId))
		}
		if Conf.Oauth2Secret != "" {
			return errors.New(fmt.Sprintf("Default value of 'Oauth2Secret' wrong: Wanted %s but was %s", "''", Conf.Oauth2Secret))
		}
		if Conf.SslCertFile != "" {
			return errors.New(fmt.Sprintf("Default value of 'SslCertFile' wrong: Wanted %s but was %s", "''", Conf.SslCertFile))
		}
		if Conf.SslKeyFile != "" {
			return errors.New(fmt.Sprintf("Default value of 'SslKeyFile' wrong: Wanted %s but was %s", "''", Conf.SslKeyFile))
		}
		if Conf.OsmBaseUrl != "" {
			return errors.New(fmt.Sprintf("Default value of 'OsmBaseUrl' wrong: Wanted %s but was %s", "''", Conf.OsmBaseUrl))
		}

		// Properties with default values:

		if Conf.TokenValidityDuration != DefaultTokenInvalidityDuration {
			return errors.New(fmt.Sprintf("Default value of 'TokenValidityDuration' wrong: Wanted %s but was %s", DefaultTokenInvalidityDuration, Conf.TokenValidityDuration))
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
		if Conf.MaxTasksPerProject != DefaultMaxTaskPerProject {
			return errors.New(fmt.Sprintf("Default value of 'MaxTasksPerProject' wrong: Wanted %d but was %d", DefaultMaxTaskPerProject, Conf.MaxTasksPerProject))
		}
		if Conf.MaxDescriptionLength != DefaultMaxDescriptionLength {
			return errors.New(fmt.Sprintf("Default value of 'MaxDescriptionLength' wrong: Wanted %d but was %d", DefaultMaxDescriptionLength, Conf.MaxDescriptionLength))
		}
		if Conf.TestEnvironment != DefaultTestEnvironment {
			return errors.New(fmt.Sprintf("Default value of 'TestEnvironment' wrong: Wanted %t but was %t", DefaultTestEnvironment, Conf.TestEnvironment))
		}

		return nil
	})
}
