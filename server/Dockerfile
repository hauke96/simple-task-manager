FROM golang:latest

RUN go get github.com/gorilla/mux
RUN go get github.com/hauke96/kingpin
RUN go get github.com/hauke96/sigolo
RUN go get github.com/kurrik/oauth1a

#RUN git clone --single-branch --branch dev https://github.com/hauke96/simple-task-manager
COPY . ./stm-server/
WORKDIR ./stm-server/
RUN go build .

ENTRYPOINT ./stm-server -c ./configs/prod.json
