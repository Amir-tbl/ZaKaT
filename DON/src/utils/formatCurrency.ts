const formatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatterWithCents = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCentsToEuros(cents: number): string {
  const euros = cents / 100;
  return formatter.format(euros);
}

export function formatCentsToEurosWithDecimals(cents: number): string {
  const euros = cents / 100;
  return formatterWithCents.format(euros);
}

export function centsToEuros(cents: number): number {
  return cents / 100;
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}
