## STAGE 1 : Build the client
FROM node:10.19.0 as builder

RUN npm i -g @angular/cli

COPY package.json /tmp/package.json
COPY package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install

COPY . ./stm-client/
WORKDIR ./stm-client/
RUN cp -r /tmp/node_modules ./

# Tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | tee /etc/apt/sources.list.d/google-chrome.list
RUN apt update
RUN apt install -y google-chrome-stable
RUN npm run docker-test
RUN apt remove -y google-chrome-stable

RUN NODE_OPTIONS="--max_old_space_size=4096" npm run build

## STAGE 2 : Configure nginx and run client
FROM nginx:latest

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder ./stm-client/dist/simple-task-manager /usr/share/nginx/html

CMD [ "nginx", "-g", "daemon off;" ]
