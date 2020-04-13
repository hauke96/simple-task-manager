package auth

import (
	"crypto/aes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hauke96/sigolo"
	"time"
)

// Struct for authentication
type Token struct {
	ValidUntil int64  `json:"valid_until"`
	User       string `json:"user"`
	Secret     string `json:"secret"`
}
var(
	key     [32]byte
)

func tokenInit() {
	key = sha256.Sum256(getRandomBytes(265))
}

func createTokenString(err error, userName string, validUntil int64) (string, bool) {
	secret, err := createSecret(userName, validUntil)
	if err != nil {
		sigolo.Error(err.Error())
		return "", true
	}

	// Create actual token
	token := &Token{
		ValidUntil: validUntil,
		User:       userName,
		Secret:     secret,
	}

	jsonBytes, err := json.Marshal(token)
	if err != nil {
		sigolo.Error(err.Error())
		return "", true
	}

	encodedTokenString := base64.StdEncoding.EncodeToString(jsonBytes)
	return encodedTokenString, false
}

// createSecret builds a new secret string encoded as base64. The idea: Take a
// secret string, hash it (so disguise the length of this secret) and encrypt it.
// To have equal length secrets, hash it again.
func createSecret(user string, validTime int64) (string, error) {
	secretBaseString := fmt.Sprintf("%s%d", user, validTime)
	secretHashedBytes := sha256.Sum256([]byte(secretBaseString))

	cipher, err := aes.NewCipher(key[:])
	if err != nil {
		sigolo.Error(err.Error())
		return "", err
	}

	secretEncryptedBytes := make([]byte, 32)
	cipher.Encrypt(secretEncryptedBytes, secretHashedBytes[:])

	secretEncryptedHashedBytes := sha256.Sum256(secretEncryptedBytes)

	return base64.StdEncoding.EncodeToString(secretEncryptedHashedBytes[:]), nil
}

func verifyToken(encodedToken string) (*Token, error) {
	tokenBytes, err := base64.StdEncoding.DecodeString(encodedToken)
	if err != nil {
		sigolo.Error(err.Error())
		return nil, err
	}

	var token Token
	err = json.Unmarshal(tokenBytes, &token)
	if err != nil {
		sigolo.Error(err.Error())
		return nil, err
	}

	targetSecret, err := createSecret(token.User, token.ValidUntil)
	if err != nil {
		sigolo.Error(err.Error())
		return nil, err
	}

	if token.Secret != targetSecret {
		return nil, errors.New("Secret not valid")
	}

	if token.ValidUntil < time.Now().Unix() {
		return nil, errors.New("Token expired")
	}
	return &token, nil
}
