import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { AttendanceStatus, FollowUpAssignment } from '@ieec/shared';
import { useSession } from '../../../../src/lib/session';
import {
  getAssignment,
  getPerson,
  recordAttendance,
} from '../../../../src/modules/follow-up/api';

const STATUSES: AttendanceStatus[] = [
  'attended',
  'did_not_attend',
  'unknown',
];

export default function AttendanceScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { account, person, can } = useSession();
  const [assignment, setAssignment] = useState<FollowUpAssignment | null>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('unknown');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;
    void (async () => {
      const a = await getAssignment(assignmentId);
      setAssignment(a);
      if (a) {
        const p = await getPerson(a.newcomerPersonId);
        setName(p ? `${p.firstName} ${p.lastName}` : a.newcomerPersonId);
      }
      setLoading(false);
    })();
  }, [assignmentId]);

  async function save() {
    if (!account || !person || !assignment) return;
    if (
      !can('follow_up.attendance.record_assigned') &&
      !can('platform.admin')
    ) {
      setError('Missing follow_up.attendance.record_assigned');
      return;
    }
    try {
      const id = await recordAttendance({
        organizationId: account.organizationId,
        assignment,
        actorPersonId: person.id,
        attendanceStatus: status,
      });
      setMessage(`Saved ${id}. Separate from weekly report.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Saturday attendance' }} />
      {loading && <ActivityIndicator />}
      <Text style={styles.lede}>{name}</Text>
      <Text style={styles.meta}>Program window 6:30 PM–9:30 PM</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {message && <Text style={styles.ok}>{message}</Text>}
      <View style={styles.row}>
        {STATUSES.map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, status === s && styles.chipActive]}
            onPress={() => setStatus(s)}
          >
            <Text>{s}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save attendance</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  lede: { fontSize: 20, fontWeight: '600' },
  meta: { color: '#3A5160' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#1B3A4B',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipActive: { backgroundColor: '#E8C547' },
  primary: {
    backgroundColor: '#C45C26',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  error: { color: '#8B1E1E' },
  ok: { color: '#1F5C45' },
});
