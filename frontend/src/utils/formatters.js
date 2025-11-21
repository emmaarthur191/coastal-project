export function formatCurrencyGHS(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? 'GHS 0.00' : '0.00';
  }
  const formatted = new Intl.NumberFormat('en-GH', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  return formatted;
}

export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return value.toFixed(decimals) + '%';
}

export function formatNumber(number) {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  return new Intl.NumberFormat('en-GH').format(number);
}

export function formatDate(date, includeTime = false) {
  if (!date) return 'N/A';
  // Validate input type
  if (typeof date !== 'string' && typeof date !== 'number' && !(date instanceof Date)) {
    return 'Invalid Date';
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
  }

  return dateObj.toLocaleDateString('en-GH', options);
}
