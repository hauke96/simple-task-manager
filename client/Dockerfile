## Stage 1 : Install dependencies
FROM node:15.4.0 as builder

RUN npm i -g @angular/cli

COPY package.json /tmp/package.json
COPY package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install

RUN mkdir /stm-client
WORKDIR /stm-client/
RUN cp -r /tmp/node_modules ./



## STAGE 2 : Build the client
COPY ./ ./
RUN NODE_OPTIONS="--max_old_space_size=4096" npm run build-prod



## STAGE 3 : Configure nginx and run client
FROM nginx:1.19.5

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder ./stm-client/dist/simple-task-manager /usr/share/nginx/html

CMD [ "nginx", "-g", "daemon off;" ]
