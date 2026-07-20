export * from './types/platform.js';
export * from './types/followUp.js';
export * from './permissions/catalog.js';
export * from './rbac/resolvePermissions.js';
export * from './followUp/reporting.js';
export * from './followUp/duplicates.js';

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}
