export function validateEmail(email) {
  // RFC 5322-inspired pattern supporting plus addressing, subdomains, and international TLDs
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(String(email).trim());
}

export function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  return { valid: true, message: '' };
}

export function validateRequired(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${fieldName} is required.`;
  }
  return '';
}

export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return 'Both start date and end date are required.';
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid date format.';
  if (start > end) return 'Start date must be before or equal to end date.';
  return '';
}
