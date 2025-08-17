#
# Stage 1: Build
#
# https://hub.docker.com/_/golang
#
FROM golang:1.25-alpine AS builder

COPY . /stm-server/
WORKDIR /stm-server/

RUN go build -o ./server .

#
# Stage 2: Run
#
# https://hub.docker.com/_/alpine
#
FROM alpine:3.22

RUN mkdir /stm-server
WORKDIR /stm-server/

COPY --from=builder /stm-server/server ./
COPY --from=builder /stm-server/database/scripts ./database/scripts
COPY --from=builder /stm-server/database/init-db.sh ./database/init-db.sh
COPY --from=builder /stm-server/config/default.json ./config.json

RUN apk add --no-cache bash grep postgresql17-client libc6-compat
# "libc6-compat" needed to make go-binary executable

ENTRYPOINT cd database && ./init-db.sh && cd .. && ./server -c ./config.json
