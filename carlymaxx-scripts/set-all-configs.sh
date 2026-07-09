#!/usr/bin/env bash
# ============================================================
# MAXX-XMD — Set config vars on ALL Heroku apps
# Usage: bash scripts/set-all-configs.sh
# Reads: HEROKU_API_KEY, PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY from env
# ============================================================
set -e

: "${HEROKU_API_KEY:?Need HEROKU_API_KEY}"
: "${PAYSTACK_SECRET_KEY:?Need PAYSTACK_SECRET_KEY}"
: "${PAYSTACK_PUBLIC_KEY:?Need PAYSTACK_PUBLIC_KEY}"

echo "Fetching all apps..."
APPS=$(curl -s https://api.heroku.com/apps \
  -H "Authorization: Bearer $HEROKU_API_KEY" \
  -H "Accept: application/vnd.heroku+json; version=3" \
  | python3 -c "import json,sys; [print(a['name']) for a in json.load(sys.stdin)]")

for app in $APPS; do
  result=$(curl -s -X PATCH "https://api.heroku.com/apps/$app/config-vars" \
    -H "Authorization: Bearer $HEROKU_API_KEY" \
    -H "Accept: application/vnd.heroku+json; version=3" \
    -H "Content-Type: application/json" \
    -d "{\"HEROKU_API_KEY\":\"$HEROKU_API_KEY\",\"HEROKU_APP_NAME\":\"$app\",\"PAYSTACK_SECRET_KEY\":\"$PAYSTACK_SECRET_KEY\",\"PAYSTACK_PUBLIC_KEY\":\"$PAYSTACK_PUBLIC_KEY\"}" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print('OK' if 'HEROKU_API_KEY' in d else d.get('message','fail'))")
  echo "$app: $result"
done
echo "Done."
