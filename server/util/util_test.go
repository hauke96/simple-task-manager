package util

import (
	"errors"
	"net/http"
	"testing"
)

type DummyResponseWriter struct {
	header       http.Header
	writtenBytes []byte
	statusCode   int
}

func newResponseWriter() *DummyResponseWriter {
	return &DummyResponseWriter{
		header:       http.Header{},
		writtenBytes: nil,
		statusCode:   0,
	}
}

func (r *DummyResponseWriter) Header() http.Header {
	return r.header
}

func (r *DummyResponseWriter) Write(b []byte) (int, error) {
	r.writtenBytes = b
	return len(b), nil
}

func (r *DummyResponseWriter) WriteHeader(statusCode int) {
	r.statusCode = statusCode
}

func TestGetParam(t *testing.T) {
	params := make(map[string][]string)
	params["foo"] = []string{"bar"}

	r := &http.Request{
		Form: params,
	}

	// Existing param

	param, err := GetParam("foo", r)
	if err != nil {
		t.Errorf("Getting params should work: %s", err.Error())
		t.Fail()
		return
	}
	if param != "bar" {
		t.Errorf("Param should have value 'bar'")
		t.Fail()
		return
	}

	// Not existing param

	param, err = GetParam("utini", r)
	if err == nil {
		t.Error("Getting params should not work")
		t.Fail()
		return
	}
	if param != "" {
		t.Errorf("Param for key 'utini' should be empty")
		t.Fail()
		return
	}
}

func TestGetIntParam(t *testing.T) {
	params := make(map[string][]string)
	params["foo"] = []string{"123"}

	r := &http.Request{
		Form: params,
	}

	// Existing param

	param, err := GetIntParam("foo", r)
	if err != nil {
		t.Errorf("Getting params should work: %s", err.Error())
		t.Fail()
		return
	}
	if param != 123 {
		t.Errorf("Param should have value '123'")
		t.Fail()
		return
	}

	// Not existing param

	param, err = GetIntParam("utini", r)
	if err == nil {
		t.Error("Getting params should not work")
		t.Fail()
		return
	}
	if param != 0 {
		t.Errorf("Param for key 'utini' should be '0''")
		t.Fail()
		return
	}
}

func TestResponseErrors(t *testing.T) {
	logger := NewLogger()

	w := newResponseWriter()
	err := errors.New("foo bar")
	ResponseBadRequest(w, logger, err)
	if w.statusCode != http.StatusBadRequest ||
		string(w.writtenBytes) != "foo bar" {
		t.Errorf("response not matching: %#v", w)
	}

	w = newResponseWriter()
	ResponseInternalError(w, logger, err)
	if w.statusCode != http.StatusInternalServerError ||
		string(w.writtenBytes) != "foo bar" {
		t.Errorf("response not matching: %#v", w)
	}

	w = newResponseWriter()
	ResponseUnauthorized(w, logger, err)
	if w.statusCode != http.StatusUnauthorized ||
		string(w.writtenBytes) != "foo bar" {
		t.Errorf("response not matching: %#v", w)
	}
}
