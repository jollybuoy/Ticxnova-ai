export function checkoutSuccessUrl(origin = typeof window !== 'undefined' ? window.location.origin : '') {
  return `${origin}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
}

export function isPaidActiveStatus(status) {
  return status === 'active';
}
