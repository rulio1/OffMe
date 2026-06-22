import Script from 'next/script';

const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const scriptSrc =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL ?? 'https://plausible.io/js/script.js';

export function PlausibleAnalytics() {
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src={scriptSrc}
      strategy="afterInteractive"
    />
  );
}