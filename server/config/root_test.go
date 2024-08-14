package config

// This is just a helper file because there are multiple test files in this package.

import (
	"stm/test"
	"testing"
)

var (
	h *test.Helper
)

func TestMain(m *testing.M) {
	h = &test.Helper{}
	m.Run()
}
