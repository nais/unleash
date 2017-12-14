#!/bin/sh
set -e
set -x

env

DB_URL="${UNLEASH_PG_URL:0:11}${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}${UNLEASH_PG_URL:11}"
echo ${DB_URL}
exec unleash -d ${DB_URL} -p 8080