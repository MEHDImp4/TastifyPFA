#!/bin/sh
set -e

if [ "${COLLECTSTATIC_ON_STARTUP:-0}" = "1" ]; then
    python manage.py collectstatic --noinput
fi

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

seed_if_needed() {
    if [ "${SEED_ON_STARTUP:-0}" != "1" ]; then
        return 0
    fi

    seed_command="${SEED_COMMAND:-seed_all}"
    user_count="$(python manage.py shell -c "from django.contrib.auth import get_user_model; print(get_user_model().objects.count())" 2>/dev/null | tail -n 1 | tr -d '[:space:]')"

    if [ "${user_count}" = "0" ]; then
        echo "No users found. Running '${seed_command}' to initialize the development dataset..."
        python manage.py "${seed_command}"
    else
        echo "Skipping startup seed. Found ${user_count} existing user(s)."
    fi
}

seed_if_needed

exec "$@"
