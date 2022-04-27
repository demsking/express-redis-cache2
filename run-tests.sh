#!/bin/bash

set -xe

yarn add --frozen-lockfile redis@4
docker-compose up -d
docker-compose logs -f tests
docker-compose down
