FROM node:6

WORKDIR /code

ADD . /code


RUN npm install
RUN npm install -g http-server

RUN npm run build

ENTRYPOINT http-server /code/dist -p 9085 -a 0.0.0.0
