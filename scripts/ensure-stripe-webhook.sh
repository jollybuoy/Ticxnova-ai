#!/usr/bin/env bash
# Create (or reuse) the Stripe webhook endpoint for Ticxnova billing.
# Requires STRIPE_SECRET_KEY. Prints the signing secret if Stripe creates a new endpoint.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_REF="${SUPABASE_PROJECT_REF:-oouewpzzeqqykzzfvmcq}"
WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/stripe-webhook"

if [[ -f "$ROOT_DIR/.env.stripe" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env.stripe"
  set +a
fi

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "Error: set STRIPE_SECRET_KEY in .env.stripe or as an env var"
  exit 1
fi

tmp_list="$(mktemp)"
tmp_create="$(mktemp)"
trap 'rm -f "$tmp_list" "$tmp_create"' EXIT

curl -sS https://api.stripe.com/v1/webhook_endpoints \
  -u "${STRIPE_SECRET_KEY}:" \
  -G --data-urlencode "limit=100" > "$tmp_list"

existing_id="$(
  WEBHOOK_URL="$WEBHOOK_URL" python3 - "$tmp_list" <<'PY'
import json, os, sys
payload = json.load(open(sys.argv[1]))
target = os.environ["WEBHOOK_URL"]
if payload.get("error"):
    print(payload["error"].get("message", payload["error"]), file=sys.stderr)
    sys.exit(2)
for item in payload.get("data", []):
    if item.get("url") == target and not item.get("disabled"):
        print(item["id"])
        break
PY
)"

if [[ -n "${existing_id:-}" ]]; then
  echo "Webhook already exists: $existing_id"
  echo "URL: $WEBHOOK_URL"
  echo "If you rotated secrets, copy the signing secret from Stripe Dashboard → Webhooks."
  exit 0
fi

curl -sS https://api.stripe.com/v1/webhook_endpoints \
  -u "${STRIPE_SECRET_KEY}:" \
  -d "url=${WEBHOOK_URL}" \
  -d "description=Ticxnova billing" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=customer.subscription.created" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted" \
  -d "enabled_events[]=invoice.paid" \
  -d "enabled_events[]=invoice.payment_succeeded" \
  -d "enabled_events[]=invoice.payment_failed" > "$tmp_create"

python3 - "$tmp_create" <<'PY'
import json, sys
payload = json.load(open(sys.argv[1]))
if payload.get("error"):
    print("Stripe error:", payload["error"].get("message", payload["error"]))
    sys.exit(1)
print("Created webhook", payload.get("id"))
print("URL:", payload.get("url"))
secret = payload.get("secret")
if secret:
    print("STRIPE_WEBHOOK_SECRET=" + secret)
    print("Save this secret with ./scripts/set-stripe-secrets.sh")
else:
    print("No signing secret in the response — copy it from the Stripe Dashboard.")
PY
