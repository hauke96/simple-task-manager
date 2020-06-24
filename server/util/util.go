package util

import (
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/pkg/errors"
	"net/http"
	"strconv"
	"strings"
)

const (
	VERSION = "1.0.0-dev"
)

func GetParam(param string, r *http.Request) (string, error) {
	value := r.FormValue(param)
	if strings.TrimSpace(value) == "" {
		return "", errors.New(fmt.Sprintf("parameter '%s' not specified", param))
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

func ResponseBadRequest(w http.ResponseWriter, err error) {
	ErrorResponse(w, err, http.StatusBadRequest)
}

func ResponseInternalError(w http.ResponseWriter, err error) {
	ErrorResponse(w, err, http.StatusInternalServerError)
}

func ErrorResponse(w http.ResponseWriter, err error, status int) {
	sigolo.Stack(err)
	sigolo.Error("ErrorResponse with status %d: %s", status, err.Error())
	w.WriteHeader(status)
	w.Write([]byte(err.Error()))
}

func LogQuery(query string, args ...interface{}) {
	for i, a := range args {
		query = strings.Replace(query, fmt.Sprintf("$%d", i+1), fmt.Sprintf("%v", a), 1)
	}

	sigolo.Debug(query)
}
