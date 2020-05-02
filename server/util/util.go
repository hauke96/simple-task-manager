package util

import (
	"fmt"
	"github.com/hauke96/sigolo"
	"net/http"
	"strconv"
	"strings"
)

var (
	NextId = 0 // public for tests
)

const (
	VERSION = "0.8.0-dev"
)

func GetId() string {
	id := NextId
	NextId += 1
	return strconv.Itoa(id)
}

func GetParam(param string, r *http.Request) (string, error) {
	value := r.FormValue(param)
	if strings.TrimSpace(value) == "" {
		return "", fmt.Errorf("parameter '%s' not specified", param)
	}

	return value, nil
}

func GetIntParam(param string, r *http.Request) (int, error) {
	valueString, err := GetParam(param, r)
	if err != nil {
		return 0, err
	}

	return strconv.Atoi(valueString)
}

func ResponseBadRequest(w http.ResponseWriter, err string) {
	Response(w, err, http.StatusBadRequest)
}

func ResponseInternalError(w http.ResponseWriter, err string) {
	Response(w, err, http.StatusInternalServerError)
}

func Response(w http.ResponseWriter, data string, status int) {
	sigolo.Error("Response with status %d: %s", status, data)
	w.WriteHeader(status)
	w.Write([]byte(data))
}

func LogQuery(query string, args ...interface{}) {
	for i, a := range args {
		query = strings.Replace(query, fmt.Sprintf("$%d", i+1), fmt.Sprintf("%v", a), 1)
	}

	sigolo.Debug(query)
}
