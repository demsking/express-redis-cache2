#!/bin/sh

set -xe

docker-compose up -d
docker-compose logs -f tests

EXIT_CODE=$(docker inspect express-redis-cache2-tests --format='{{.State.ExitCode}}')

if [ "$EXIT_CODE" = '0' ]; then
  docker-compose down
else
  docker-compose down
  exit $EXIT_CODE
fi
