#!/bin/sh
set -e

cd "$CI_PRIMARY_REPOSITORY_PATH"

# Capacitor Podfile resolves pods from pnpm node_modules.
corepack enable
pnpm install --frozen-lockfile

cd apps/web/ios/App
pod install
