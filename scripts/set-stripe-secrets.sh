#!/usr/bin/env bash
# Set Supabase edge function secrets for Ticxnova Stripe billing.
# Run from project root after: supabase login
#
# Usage:
#   ./scripts/set-stripe-secrets.sh
# Or pass values inline:
#   STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx ./scripts/set-stripe-secrets.sh

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

supabase secrets set \
  --project-ref "$PROJECT_REF" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  STRIPE_STARTER_PRICE_ID=price_1TrSG9H1xnYBWgiR8Jrks4o6 \
  STRIPE_PROFESSIONAL_PRICE_ID=price_1TrSGAH1xnYBWgiRiENaDWTk \
  STRIPE_ENTERPRISE_PRICE_ID=price_1TrSGAH1xnYBWgiRkChP3iJc

echo "Stripe secrets set on project $PROJECT_REF"
echo "Deploy functions: supabase functions deploy create-checkout-session create-billing-portal-session stripe-webhook --project-ref $PROJECT_REF"
