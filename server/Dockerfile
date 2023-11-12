# Stage 1: Build
FROM golang:1.21-alpine AS builder

COPY . /stm-server/
WORKDIR /stm-server/

RUN go build -o ./server .

# Stage 2: Run
FROM alpine:3.18

RUN mkdir /stm-server
WORKDIR /stm-server/

COPY --from=builder /stm-server/server ./
COPY --from=builder /stm-server/database/scripts ./database/scripts
COPY --from=builder /stm-server/database/init-db.sh ./database/init-db.sh
COPY --from=builder /stm-server/config/default.json ./config.json

RUN apk add --no-cache bash grep postgresql-client libc6-compat
# "libc6-compat" needed to make go-binary executable

ENTRYPOINT cd database && ./init-db.sh && cd .. && ./server -c ./config.json