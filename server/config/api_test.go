package config

import (
	"fmt"
	"github.com/pkg/errors"
	"testing"
)

func TestGetConfigDto(t *testing.T) {
	h.Run(t, func() error {
		Conf = &Config{}
		Conf.SourceRepoURL = "https://some.url/my/repo"
		Conf.MaxDescriptionLength = 200
		Conf.MaxTasksPerProject = 345

		dto := GetConfigDto()

		if dto.SourceRepoURL != Conf.SourceRepoURL {
			return errors.New(fmt.Sprintf("Dto value of 'SourceRepoURL' wrong: Wanted %s but was %s", Conf.SourceRepoURL, dto.SourceRepoURL))
		}
		if dto.MaxDescriptionLength != Conf.MaxDescriptionLength  {
			return errors.New(fmt.Sprintf("Dto value of 'MaxDescriptionLength' wrong: Wanted %d but was %d", Conf.MaxDescriptionLength, dto.MaxDescriptionLength))
		}
		if dto.MaxTasksPerProject != Conf.MaxTasksPerProject {
			return errors.New(fmt.Sprintf("Dto value of 'MaxTasksPerProject' wrong: Wanted %d but was %d", Conf.MaxTasksPerProject, dto.MaxTasksPerProject))
		}

		return nil
	})
}
