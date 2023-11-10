package util

import (
	"fmt"
	"github.com/pkg/errors"
	"net/http"
	"strconv"
	"strings"
)

const (
	VERSION = "1.4.4-SNAPSHOT.3"
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

func ResponseBadRequest(w http.ResponseWriter, logger *Logger, err error) {
	ErrorResponse(w, logger, err, http.StatusBadRequest)
}

func ResponseInternalError(w http.ResponseWriter, logger *Logger, err error) {
	ErrorResponse(w, logger, err, http.StatusInternalServerError)
}

func ResponseUnauthorized(w http.ResponseWriter, logger *Logger, err error) {
	ErrorResponse(w, logger, err, http.StatusUnauthorized)
}

func ErrorResponse(w http.ResponseWriter, logger *Logger, err error, status int) {
	if logger != nil {
		logger.Err("ErrorResponse with status %d: %s", status, err.Error())
	}
	w.WriteHeader(status)
	w.Write([]byte(err.Error()))
}
