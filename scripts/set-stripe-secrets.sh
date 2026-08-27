#!/usr/bin/env bash
# Set Supabase edge function secrets for Ticxnova Stripe billing.
# Run from project root after: supabase login
#
# Usage:
#   STRIPE_SECRET_KEY=sk_live_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx ./scripts/set-stripe-secrets.sh
# Test keys automatically select test Price IDs; live keys select live Price IDs.

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-oouewpzzeqqykzzfvmcq}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

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

if [[ -z "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  echo "Error: set STRIPE_WEBHOOK_SECRET in .env.stripe or as an env var"
  exit 1
fi

LIVE_STARTER=price_1TezkkH1xnYBWgiRHnzscJTe
LIVE_PROFESSIONAL=price_1TezsyH1xnYBWgiRWJdPkNSn
LIVE_ENTERPRISE=price_1TezwAH1xnYBWgiRaK6gLtRa
TEST_STARTER=price_1TrSG9H1xnYBWgiR8Jrks4o6
TEST_PROFESSIONAL=price_1TrSGAH1xnYBWgiRiENaDWTk
TEST_ENTERPRISE=price_1TrSGAH1xnYBWgiRkChP3iJc

if [[ "$STRIPE_SECRET_KEY" == sk_live_* || "$STRIPE_SECRET_KEY" == rk_live_* ]]; then
  STARTER_PRICE="${STRIPE_STARTER_PRICE_ID:-$LIVE_STARTER}"
  PROFESSIONAL_PRICE="${STRIPE_PROFESSIONAL_PRICE_ID:-$LIVE_PROFESSIONAL}"
  ENTERPRISE_PRICE="${STRIPE_ENTERPRISE_PRICE_ID:-$LIVE_ENTERPRISE}"
  MODE=live
else
  STARTER_PRICE="${STRIPE_STARTER_PRICE_ID:-$TEST_STARTER}"
  PROFESSIONAL_PRICE="${STRIPE_PROFESSIONAL_PRICE_ID:-$TEST_PROFESSIONAL}"
  ENTERPRISE_PRICE="${STRIPE_ENTERPRISE_PRICE_ID:-$TEST_ENTERPRISE}"
  MODE=test
fi

echo "Setting Stripe secrets on $PROJECT_REF ($MODE prices)"

supabase secrets set \
  --project-ref "$PROJECT_REF" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  STRIPE_STARTER_PRICE_ID="$STARTER_PRICE" \
  STRIPE_PROFESSIONAL_PRICE_ID="$PROFESSIONAL_PRICE" \
  STRIPE_ENTERPRISE_PRICE_ID="$ENTERPRISE_PRICE"

echo "Secrets set. Next:"
echo "  ./scripts/ensure-stripe-webhook.sh"
echo "  supabase functions deploy create-checkout-session create-billing-portal-session confirm-checkout-session stripe-webhook --project-ref $PROJECT_REF"
