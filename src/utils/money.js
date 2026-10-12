// Every amount a customer sees is in US dollars. VIP packages are still charged in
// VND by the payment gateway; the API sends the USD display price as `price_usd`
// (converted at the site's fixed rate).

const FALLBACK_USD_VND_RATE = 26000;

export const formatUsd = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// USD display price of a VIP package. Falls back to converting the VND price when
// the API response predates `price_usd`.
export const packageUsd = (pkg) => {
  if (!pkg) return 0;
  if (pkg.price_usd != null) return Number(pkg.price_usd);
  return Math.round((Number(pkg.price || 0) / FALLBACK_USD_VND_RATE) * 100) / 100;
};
