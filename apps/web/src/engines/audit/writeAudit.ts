import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { AuditLog } from '@ieec/shared';
import { getDb } from '../../lib/firebase';

export async function writeAudit(
  entry: Omit<AuditLog, 'id' | 'createdAt'>,
): Promise<void> {
  await addDoc(collection(getDb(), 'auditLogs'), {
    ...entry,
    createdAt: serverTimestamp(),
  });
}
