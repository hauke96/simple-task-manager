## Stage 1 : Install dependencies
FROM node:15.7.0 as builder

RUN mkdir /stm-client
WORKDIR /stm-client/

COPY package.json /stm-client/package.json
COPY package-lock.json /stm-client/package-lock.json

RUN npm install



## STAGE 2 : Build the client
COPY ./ ./
RUN NODE_OPTIONS="--max_old_space_size=4096" npm run build-prod



## STAGE 3 : Configure nginx and run client
FROM nginx:1.19.6

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder ./stm-client/dist/simple-task-manager /usr/share/nginx/html

CMD [ "nginx", "-g", "daemon off;" ]
