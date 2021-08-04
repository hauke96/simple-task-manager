# Stage 1: Build
FROM golang:1.15.7 AS builder

COPY . /stm-server/
WORKDIR /stm-server/

RUN go build .

# Stage 2: Run
FROM alpine:latest

RUN mkdir /stm-server
WORKDIR /stm-server/

COPY --from=builder /stm-server/server ./
COPY --from=builder /stm-server/database/scripts ./database/scripts
COPY --from=builder /stm-server/database/init-db.sh ./database/init-db.sh
COPY --from=builder /stm-server/config/default.json ./config.json

RUN apk add --no-cache bash
RUN apk add --no-cache postgresql-client
# To make go-binary executable:
RUN apk add --no-cache libc6-compat

ENTRYPOINT cd database && ./init-db.sh && cd .. && ./server -c ./config.json