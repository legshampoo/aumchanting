#!/bin/sh
set -e

node /app/api/dist/index.js &
WEB_PID=$!

HOSTNAME=0.0.0.0 PORT=3000 node apps/web/server.js &
NEXT_PID=$!

nginx -c /app/nginx.conf -g 'daemon off;' &
NGINX_PID=$!

trap 'kill "$WEB_PID" "$NEXT_PID" "$NGINX_PID" 2>/dev/null' TERM INT
wait "$NGINX_PID"
