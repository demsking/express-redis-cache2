#!/bin/bash

set -xe

docker-compose up -d
docker-compose logs -f tests
docker-compose down
