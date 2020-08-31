package context

import (
	"fmt"
	"github.com/hauke96/sigolo"
)

var (
	nextTraceId = 0
)

func GetNextTraceId() int {
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