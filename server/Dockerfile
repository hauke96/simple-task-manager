FROM golang:latest

COPY . ./stm-server/
WORKDIR ./stm-server/
RUN go build

ENTRYPOINT ./stm-server -c ./config/prod.json
