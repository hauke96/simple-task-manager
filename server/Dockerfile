FROM golang:latest

COPY . ./stm-server/
WORKDIR ./stm-server/

ENTRYPOINT go run main.go -c ./config/prod.json
