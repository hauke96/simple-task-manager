package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/pkg/errors"
	"time"
)

// Struct for authentication
type Token struct {
	ValidUntil int64  `json:"valid_until"`
	User       string `json:"user"`
	UID        string `json:"uid"`
	Secret     string `json:"secret"`
}

var (
	key []byte
)

func tokenInit() error {
	bytes := []byte("test")//getRandomBytes(256)
	key = bytes
	return nil
}

func createTokenString(err error, userName string, userId string, validUntil int64) (string, error) {
	secret := createSecret(userName, userId, validUntil)

	// Create actual token
	token := &Token{
		ValidUntil: validUntil,
		User:       userName,
		UID:        userId,
		Secret:     secret,
	}

	jsonBytes, err := json.Marshal(token)
	if err != nil {
		msg := "error marshalling token object"
		sigolo.Error("%s. Token object: %#v", msg, token)
		return "", errors.Wrap(err, msg)
	}

	encodedTokenString := base64.StdEncoding.EncodeToString(jsonBytes)
	return encodedTokenString, nil
}

// createSecret builds a new secret string encoded as base64. This uses HMAC with SHA-256 inside.
func createSecret(user string, uid string, expirationTime int64) string {
	// Create base string "<userName><userId><expirationTime>"
	secretBaseString := fmt.Sprintf("%s\n%s\n%d\n", user, uid, expirationTime)

	hash := hmac.New(sha256.New, key)
	hash.Write([]byte(secretBaseString))
	secretEncryptedHashedBytes := hash.Sum(nil)

	return base64.StdEncoding.EncodeToString(secretEncryptedHashedBytes[:])
}

func verifyToken(encodedToken string) (*Token, error) {
	tokenBytes, err := base64.StdEncoding.DecodeString(encodedToken)
	if err != nil {
		sigolo.Error("Failed to decode this token: %s", encodedToken)
		return nil, errors.Wrap(err, "error decoding encoded token")
	}

	var token Token
	err = json.Unmarshal(tokenBytes, &token)
	if err != nil {
		msg := "error marshalling token object"
		sigolo.Error("%s. Token bytes: %s", msg, string(tokenBytes))
		return nil, errors.Wrap(err, msg)
	}

	targetSecret := createSecret(token.User, token.UID, token.ValidUntil)

	if token.Secret != targetSecret {
		return nil, errors.New("Secret not valid")
	}

	if token.ValidUntil < time.Now().Unix() {
		return nil, errors.New("Token expired")
	}

	return &token, nil
}
