/**
 * Formats a numeric price into Pakistani currency convention (Lac / Crore)
 * e.g., 4800000 -> "48 Lac", 14500000 -> "1.45 Crore"
 */
export function formatPKR(amount: number): {
  short: string;
  full: string;
  denomination: string;
} {
  if (isNaN(amount) || amount === 0) {
    return { short: 'PKR 0', full: 'PKR 0', denomination: 'PKR 0' };
  }

  const abs = Math.abs(amount);
  let short = '';
  let denomination = '';

  if (abs >= 10000000) {
    // 1 Crore = 10 Million = 10,000,000
    const crore = amount / 10000000;
    const formatted = crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(2).replace(/\.?0+$/, '');
    short = `${formatted} Crore`;
    denomination = `${formatted} Crore PKR`;
  } else if (abs >= 100000) {
    // 1 Lac = 100,000
    const lac = amount / 100000;
    const formatted = lac % 1 === 0 ? lac.toFixed(0) : lac.toFixed(2).replace(/\.?0+$/, '');
    short = `${formatted} Lac`;
    denomination = `${formatted} Lac PKR`;
  } else if (abs >= 1000) {
    const k = amount / 1000;
    const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
    short = `${formatted}K`;
    denomination = `${formatted}K PKR`;
  } else {
    short = `${amount}`;
    denomination = `${amount} PKR`;
  }

  const full = 'PKR ' + amount.toLocaleString('en-PK');

  return { short: `PKR ${short}`, full, denomination };
}

/**
 * Format relative time or clean date
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
