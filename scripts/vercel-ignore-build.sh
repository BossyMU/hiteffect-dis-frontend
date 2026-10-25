#!/bin/bash
# Vercel's "Ignored Build Step" (ignoreCommand in vercel.json): exit 1 builds, exit 0 skips.
# Each Vercel project builds only its production deployments: UAT from main, production from the
# production branch. Previews are skipped. If Vercel gives us nothing to go on, build: preview builds
# fail on their own without APP_ENV / VITE_APP_ENV, before touching any database.
env_name="${APP_ENV:-$VITE_APP_ENV}"
case "$env_name" in
  production) branch=production ;;
  uat) branch=main ;;
  *) branch= ;;
esac
echo "Ignored Build Step: VERCEL_ENV=${VERCEL_ENV:-unset} branch=${VERCEL_GIT_COMMIT_REF:-unset} env=${env_name:-unset}"

if [ "$VERCEL_ENV" = production ]; then echo "Building: production deployment"; exit 1; fi
if [ -n "$branch" ] && [ "$VERCEL_GIT_COMMIT_REF" = "$branch" ]; then echo "Building: $branch branch"; exit 1; fi
if [ -z "$VERCEL_ENV" ] && [ -z "$VERCEL_GIT_COMMIT_REF" ]; then echo "Building: no deployment details"; exit 1; fi
echo "Skipping: not this project's branch"
exit 0
