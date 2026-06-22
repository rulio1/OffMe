export const ONBOARDING_KEY = 'offme-onboarding-done';
export const ONBOARDING_PENDING_KEY = 'offme-onboarding-pending';

export function markOnboardingPending(): void {
  localStorage.setItem(ONBOARDING_PENDING_KEY, '1');
}

export function shouldShowOnboarding(): boolean {
  if (localStorage.getItem(ONBOARDING_KEY) === '1') return false;
  return localStorage.getItem(ONBOARDING_PENDING_KEY) === '1';
}

export function completeOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, '1');
  localStorage.removeItem(ONBOARDING_PENDING_KEY);
}