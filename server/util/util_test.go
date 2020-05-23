package util

import (
	"net/http"
	"testing"
)

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
