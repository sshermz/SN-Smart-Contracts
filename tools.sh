#!/usr/bin/env bash

set -o errexit
#set -o verbose
set -o xtrace
set -o nounset

case "$1" in


run)
    docker-compose create --build --force-recreate demo
    docker-compose run --service-ports demo
    ;;

clean)
    docker-compose down --rmi all --remove-orphans
    ;;

hard-clean)
    docker image prune
    docker-compose down --rmi all --remove-orphans
    docker kill `docker ps -q` || true
    docker rm `docker ps -a -q`
    docker rmi `docker images -q`
    docker volume rm `docker volume ls -qf dangling=true`
    ;;

*) echo 'No operation specified'
    exit 0;
    ;;

esac
