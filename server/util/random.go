package util

import (
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"github.com/pkg/errors"
)

func GetRandomString() (string, error) {
	randomBytes, err := GetRandomBytes(64)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", sha256.Sum256(randomBytes)), nil
}

func GetRandomBytes(count int) ([]byte, error) {
	bytes := make([]byte, count)

	n, err := rand.Read(bytes)

	if n != count {
		return nil, errors.New(fmt.Sprintf("Could not read all %d random bytes", count))
	}
	if err != nil {
		return nil, errors.Wrap(err, "Unable to read random bytes")
	}

	return bytes, nil
}
