#!/bin/bash
set -e
set -x

env

echo "${UNLEASH_PG_URL:0:11}"
echo "${UNLEASH_PG_URL:11}"
echo "${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@"
# postgres://tpa-unleashdb-postgresql.tpa.svc.nais.local:5432 -> postgres://username:password@tpa-unleashdb-postgresql.tpa.svc.nais.local:5432
DB_URL="${UNLEASH_PG_URL:0:11}${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@${UNLEASH_PG_URL:11}"
echo "${DB_URL}"
exec unleash -d "${DB_URL}" -p 8080