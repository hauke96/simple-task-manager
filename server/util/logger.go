package util

import (
	"fmt"
	"github.com/hauke96/sigolo"
	"strings"
)

var (
	nextTraceId = 0
)

func GetLogTraceId() int {
	defer func() { nextTraceId++ }() // Just increase trace-ID counter after return statement
	return nextTraceId
}

type Logger struct {
	LogTraceId int
}

func (l *Logger) Log(format string, args ...interface{}) {
	sigolo.Infob(1, "#%x | %s", l.LogTraceId, fmt.Sprintf(format, args...))
}

func (l *Logger) Err(format string, args ...interface{}) {
	sigolo.Errorb(1, "#%x | %s", l.LogTraceId, fmt.Sprintf(format, args...))
}

func (l *Logger) Debug(message string) {
	sigolo.Debugb(1, "#%x | %s", l.LogTraceId, message)
}

func (l *Logger) Stack(err error) {
	sigolo.Stackb(1, err)
}

func (l *Logger) LogQuery(query string, args ...interface{}) {
	for i, a := range args {
		query = strings.Replace(query, fmt.Sprintf("$%d", i+1), fmt.Sprintf("%v", a), 1)
	}

	l.Debug(query)
}