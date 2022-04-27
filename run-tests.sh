#!/bin/bash

set -xe

yarn global add --frozen-lockfile --global-folder=node_modules redis@4
docker-compose up -d
docker-compose logs -f tests
docker-compose down
