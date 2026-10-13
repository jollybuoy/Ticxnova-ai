import { describe, expect, it } from 'vitest';
import { getRecommendedVerificationPath } from './verificationService';

describe('getRecommendedVerificationPath', () => {
  it('recommends business email when the admin inbox matches the company domain', () => {
    expect(
      getRecommendedVerificationPath({
        adminEmailMatchesDomain: true,
        status: 'pending_domain_verification',
      }),
    ).toBe('email');
  });

  it('recommends DNS when the account used Gmail or another unmatched inbox', () => {
    expect(
      getRecommendedVerificationPath({
        adminEmailMatchesDomain: false,
        status: 'pending_domain_verification',
      }),
    ).toBe('dns');
  });

  it('highlights platform review after the user submits it', () => {
    expect(
      getRecommendedVerificationPath({
        adminEmailMatchesDomain: false,
        status: 'under_review',
      }),
    ).toBe('review');
  });
});
