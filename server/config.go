package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"strings"

	"github.com/hauke96/sigolo"
)

var (
	Conf *Config
)

type Config struct {
	ServerUrl        string `json:"server-url"`
	Port             int    `json:"port"`
	OauthConsumerKey string `json:"oauth-consumer-key"`
	OauthSecret      string `json:"oauth-secret"`
	OsmBaseUrl       string `json:"osm-base-url"`
	DebugLogging     bool   `json:"debug-logging"`
	SslCertFile      string `json:"ssl-cert-file"`
	SslKeyFile       string `json:"ssl-key-file"`
}

func loadConfig(file string) {
	fileContent, err := ioutil.ReadFile(file)
	if err != nil {
		sigolo.FatalCheck(err)
	}

	Conf = &Config{}

	err = json.Unmarshal([]byte(fileContent), Conf)
	if err != nil {
		sigolo.FatalCheck(err)
	}

	sigolo.Info("Use config file '%s'", file)

	wholeConfStr := fmt.Sprintf("%#v", Conf)                            // -> "main.Config{Serve...}"
	splittedConfStr := strings.Split(wholeConfStr, "{")                 // --> "main.Config" and "Serve...}"
	propertyString := splittedConfStr[1][0 : len(splittedConfStr[1])-1] // clut last "}" off
	propertyList := strings.Split(propertyString, ", ")

	sigolo.Info("Config:")
	for _, p := range propertyList {
		propertyName := strings.Split(p, ":")[0]
		propertyValue := strings.Join(strings.Split(p, ":")[1:], ":") // Join remaining parts back together
		sigolo.Info("  %-*s = %s", 20, propertyName, propertyValue)
	}
}
