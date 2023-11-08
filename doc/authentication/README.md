
> **DEPRECATED** Since OAuth2 is used but this file describes the old OAuth1a process!

This file describes the process of authentication, token creation and token validation in the SimpleTaskManager.
We also take a look on technical aspects (what are the functions exactly doing) and on cryptographic basics (verification, security of the token, etc.).

# Login and authorization process

The easiest way to describe the process and the communication between all the servers is by showing you an diagram:

![](authentication.png)

# Token generation and handling

STM does not use the OSM request- and access-tokens from the oauth process for two main reasons:

1. We would have to make requests to the OSM-Servers in order to validate the token. In a productive environment, this would result in thousands of requests per day. That's not good.
2. Having an own token enables us to store user data along with the secret part of the token (expiration date, permissions, roles, user name, etc.)

**Furthermore:**<br>
We can build a custom solution where the server does not has any state to store.
All the information is securely stored on the client (specifically the local storage of the browser).

## Why not using the OSM token?

1. I don't want to depend on the OSM servers.
2. I don't have to secure the OSM tokens in order to prevent unwanted requests by somebody who got the token.
3. I can decide what to put into the token (user name, uid, dates, maybe further stuff in the future)
4. Even when using the OSM token, I would have to define some sort of expiration date so I would also need a wrapper around the OSM token to store this information
5. I don't have any possibility to invalidate such token per se (without adding additional secrets or whatnot)

## Encryption key

When the server starts, it initializes the authentication service (`auth.go:Init()`) and chooses an encryption key at random.
This key consists of 256 random bytes (so 2048 bits) and is later used when creating the secret of a token.

### Why does the server generate the key?

One could either specify a key by environment variables/CLI arguments or specify it by using a config file/key store on disk.
Generating a new key every time the server starts has the "effect" (I don't want to call it "disadvantage") to invalidate all currently existing tokens.
This is not too bad and we don't have to struggle with hiding the key by file permissions, key stores, password databases (keePass or what ever), etc.

## Token structure

A token consists of three fields:

| Struct field name | JSON name | Type | Description |
| ----------------- | --------- | ---- | ----------- |
| `ValidUntil` | `valid_until` | `int64` | The UTC date until the token is valid. This will be checked on each request by the server. |
| `User` | `user` | `string` | The user name, which is shown in the client
| `UID` | `uid` | `string` | The user ID, which is used to identify users
| `Secret` | `secret` | `string` | A secret string created by the server using symmetric encryption and hashing (see blow). This prevents an attacker from faking a token.

## Token Creation

When the authentication process with the OSM-server is done (see above), a new token will be created.

### Creation of the secret

The according function to this is `token.go:createTokenString()`.

**1.) Hash key**
 
As described above, the server creates a key during startup.
This key is later used to create the secret part of a token (s. step 4.) below).

**2.) Get the content of the secret.**

I call this the "base string" as it contains the raw information used later in the hash.
The format of this base string is: `<userName>\n<userId>\n<expirationTime>`.

* The `<userName>` is just the user name as string
* The `<userId>` is the id from OSM as string
* The `<expirationTime>` is the expiration time as UTC millis encoded as string

Example base string: `john-doe\n42\n12345678`

**3.) Create raw hash**

To create the hash value, the `HMAC-SHA256` algorithm is used, which uses the key and the base string.
`HMAC-SHA256` is a *keyed hash function*, so its output always has a certain length but needs a secret key to create this output.

**4.) Encode to final secret**

The "raw token" (the bare output of `HMAC-SHA256`) is then encoded using `base64` to store and transfer it more easily.
This final string is then the string we all above called *secret*.

### Token creation

After creating our secret, we can build the token (which happens in `token.go.createSecret()`, which is called at the end of `auth.go:OauthCallback()`).
This is quite simple:

1. Create a new `Token` object
2. Set all needed fields (see above) including the secret
3. Serialize the go object into a JSON string
4. Encode the whole token-JSON-string as Base64

### Return token to web-client

The server then start a redirect to the clients landing page (at the end of `auth.go:OauthCallback()`).
The token is attached as query parameter, so the full redirect URL look something like this:

```
https://your.server.com/oauth-landing?token=eyJ2YWxp...UT0ifQ==
```

**Very important:**<br>
Nothing is stored on the server!
As soon as this redirect takes place, the server forgets everything about the created token.

## Token verification

In order to authenticate a request, the client has to send the whole token to the server.

Before the server handles any incoming request (except for a few un-authenticated ones as described in the API-documentation), the token will be verified.

### Authenticated HTTP-handler

The Verification happens by using "authenticated handler functions" in the `api_v...go` where the HTTP-handlers are registered.
The function `api/util.go:authenticatedHandler()` ensures that every incoming request gets verified.

This also means:
The handler for the OAuth login and callback are no authenticated handler (s. API doc), they do - of course - not need a token.
 
### Verification process

The request verification takes place in `auth.go:VerifyRequest()` which directly calls `token.go:verifyToken()`.

The verification process of the `verifyToken()` function:

1. Decode the base64 encoded Token and unmarshal it to get a golang object of type `Token`
2. Read the secret from that received token
3. Create a second secret based on the data from the token
4. Perform some checks
    1. Check is the two secrets are equal
    2. Check if the token is not expired yet

Only if everything above worked and resulted in no errors, the token is valid and the request is further processed by the server.

## Token security

### Cryptography lesson 1: Canonical verification

The actual verification takes place in the `auth.go:VerifyRequest()` function.
There the server performs a *canonical verification*:

**Definition:**<br>
To verify a given secret `S`, we *reconstruct* this secret and call is `S'`.
Then we simply check whether `S == S'` is true.

If this check succeeded, then we know that the *token hasn't changed* (neither the secret, nor the payload data), otherwise the given secret `S` is not valid.

#### What is HMAC-SHA256?

SHA256 is a very good hashing algorithm (part of the often recommended SHA-2 algorithm family) and is used in the HMAC algorithm.

The HMAC algorithm creates a MAC (message authentication code) using a **hashing algorithm** (SHA-256 in this case) and a **secret key**.
It creates a bit-string to check a) the **integrity** of a message and b) the **authenticity**.

if such check succeeds, we know that the message (in our case the token), hasn't changed (e.g. by an attacker → integrity) and was issued by this server (and not by anybody else → authenticity).

#### Why is this secure?

**Basically:**<br>
Only the STM Server knows the key for the HMAC-SHA256 algorithm. So only the server is able to create valid tokens, noby else is able to do this.<br>

**Bit more details:**<br>
The security is heavily based on the assumption that the cryptographic primitives (in this case the hash function SHA-256 used in the HMAC algorithm and the HMAC algorithm itself) are hard to break.
This means: Nobody should (easily<sup>(*)</sup>) be able to change e.g. the expiration date of the token and get the same secret as before.

If an attacker would easily be able to do this, then SHA-256 or HMAC are broken (or both).
The attacker was then able to analyse the SHA-256 or HMAC algorithms in order to find a collision in the tokens (two different input values but same token secret).

So again: When an attacker succeeds, then the SHA-256 and AES algorithms are broken and the whole world has a severe problem (as everybody uses this).

However, the HMAC algorithm (one of the best MAC algorithms we have) and the SHA-256 algorithm (one of the best hashing algorithms we have) use cryptographic construction (like the *Davies-Meyer construction* in combination with *block ciphers*) to make it practically impossible to get such collision.

_<sup>(*)</sup> in polynomial many calculation steps_

#### Are there security vulnerabilities?

At the time of this writing I don't know of any strong vulnerabilities or even exploits.
Neither in my code nor in the code of the golang crypto package (used to SHA-256 and HMAC).

**But as always:** There are probably vulnerabilities not found yet.
However this applies to every piece of code that exists.