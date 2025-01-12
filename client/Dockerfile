# Stage 1: Buil
FROM node:22-alpine AS builder

COPY . /stm-client
WORKDIR /stm-client/

COPY package.json /stm-client/package.json
COPY package-lock.json /stm-client/package-lock.json

RUN npm install

RUN NODE_OPTIONS="--max_old_space_size=4096" npm run build

# Stage 2: Run
FROM nginx:1.27-alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /stm-client/dist/simple-task-manager /usr/share/nginx/html

ENTRYPOINT nginx -g 'daemon off;'
