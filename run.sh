#!/bin/bash
set -e
set -x

#env

echo "${UNLEASH_PG_URL:0:11}"
echo "${UNLEASH_PG_URL:11}"
echo "${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@"


DB_URL="${UNLEASH_PG_URL:0:11}${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@${UNLEASH_PG_URL:11}"
echo "${DB_URL}"
exec unleash -d "${DB_URL}" -p 8080