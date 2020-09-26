FROM golang:1.14.4

COPY . ./stm-server/
WORKDIR ./stm-server/

RUN apt update
RUN apt install -y postgresql-client

ENTRYPOINT cd database && ./init-db.sh && cd .. && go run main.go -c ./config/prod.json