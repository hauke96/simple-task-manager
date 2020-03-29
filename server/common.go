package main

import (
	"strconv"
)

var (
	nextId = 0
)

func GetId() string {
	id := nextId
	nextId += 1
	return strconv.Itoa(id)
}
