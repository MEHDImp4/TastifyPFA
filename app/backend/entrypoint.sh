#!/bin/sh
set -e

python manage.py collectstatic --noinput

# Retry migrations to handle the race condition when backend and
# celery-worker both run this entrypoint at the same time.
migrate_with_retry() {
    n=0
    while [ $n -lt 3 ]; do
        if python manage.py migrate --noinput; then
            return 0
        fi
        n=$(($n + 1))
        echo "Migration failed (attempt $n/3), retrying in 3s..."
        sleep 3
    done
    echo "Migration failed after 3 attempts, aborting."
    return 1
}

migrate_with_retry

exec "$@"
