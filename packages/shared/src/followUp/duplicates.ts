function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export interface DuplicateCandidateInput {
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
}

export interface DuplicatePersonCandidate {
  id: string;
  firstName: string;
  lastName: string;
  phoneNormalized?: string | null;
  emailNormalized?: string | null;
}

/**
 * Score possible Person duplicates. No auto-merge — callers route to review
 * when any candidate scores above threshold.
 */
export function findDuplicateCandidates(
  input: DuplicateCandidateInput,
  people: DuplicatePersonCandidate[],
  threshold = 2,
): DuplicatePersonCandidate[] {
  const first = normalizeName(input.firstName);
  const last = normalizeName(input.lastName);
  const phone = input.phone ? normalizePhone(input.phone) : '';
  const email = input.email ? normalizeEmail(input.email) : '';

  return people
    .map((person) => {
      let score = 0;
      if (first && person.firstName && normalizeName(person.firstName) === first) {
        score += 1;
      }
      if (last && person.lastName && normalizeName(person.lastName) === last) {
        score += 1;
      }
      if (phone && person.phoneNormalized && person.phoneNormalized === phone) {
        score += 2;
      }
      if (email && person.emailNormalized && person.emailNormalized === email) {
        score += 2;
      }
      return { person, score };
    })
    .filter((row) => row.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.person);
}
