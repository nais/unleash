#!/bin/sh
set -e
set -x

env

echo "postgres://${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@tpa-unleashdb-postgresql.tpa.svc.nais.local:5432/unleash"

exec unleash -d postgres://${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@tpa-unleashdb-postgresql.tpa.svc.nais.local:5432/unleash -p 8080