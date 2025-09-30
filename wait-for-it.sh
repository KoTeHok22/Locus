#!/bin/bash

set -e

host="$1"
shift
cmd="$@"

until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$host" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  >&2 echo "Postgres недоступен - ожидание"
  sleep 1
done

>&2 echo "Postgres доступен - выполнение команды"
exec $cmd