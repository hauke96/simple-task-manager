package main

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

var (
	nextId = 0
)

func GetId() string {
	id := nextId
	nextId += 1
	return strconv.Itoa(id)
}

func getParam(param string, r *http.Request) (string, error) {
	value := r.FormValue(param)
	if strings.TrimSpace(value) == "" {
		errMsg := fmt.Sprintf("Parameter '%s' not specified", param)
		return "", errors.New(errMsg)
	}

	return value, nil
}

func getIntParam(param string, w http.ResponseWriter, r *http.Request) (int, error) {
	valueString, err := getParam(param, r)
	if err != nil {
		return 0, err
	}

	return strconv.Atoi(valueString)
}

func responseBadRequest(w http.ResponseWriter, err string) {
	w.WriteHeader(http.StatusBadRequest)
	w.Write([]byte(err))
}

func responseInternalError(w http.ResponseWriter, err string) {
	w.WriteHeader(http.StatusInternalServerError)
	w.Write([]byte(err))
}

func response(w http.ResponseWriter, data string, status int) {
	w.WriteHeader(status)
	w.Write([]byte(data))
}
