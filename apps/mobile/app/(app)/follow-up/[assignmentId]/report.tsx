import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  DEFAULT_WEEKLY_REPORT_FIELDS,
  type FollowUpAssignment,
} from '@ieec/shared';
import { useSession } from '../../../../src/lib/session';
import {
  getAssignment,
  getPerson,
  submitWeeklyReport,
} from '../../../../src/modules/follow-up/api';

export default function WeeklyReportScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { account, person, can } = useSession();
  const [assignment, setAssignment] = useState<FollowUpAssignment | null>(null);
  const [name, setName] = useState('');
  const [contactMade, setContactMade] = useState(true);
  const [expectedToAttend, setExpectedToAttend] = useState('unknown');
  const [responses, setResponses] = useState<Record<string, string>>({});
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

  async function onSubmit() {
    if (!account || !person || !assignment) return;
    if (!can('follow_up.reports.submit') && !can('platform.admin')) {
      setError('Missing follow_up.reports.submit');
      return;
    }
    setError(null);
    try {
      const id = await submitWeeklyReport({
        organizationId: account.organizationId,
        assignment,
        actorPersonId: person.id,
        contactMade,
        expectedToAttend,
        dynamicResponses: responses,
        canEditLocked: can('follow_up.reports.edit_locked'),
      });
      setMessage(`Saved ${id}. Attendance is a separate screen.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Weekly report' }} />
      {loading && <ActivityIndicator />}
      <Text style={styles.lede}>{name}</Text>
      <Text style={styles.meta}>
        Due Friday · late Sat+ · 7-day edit window. Not attendance.
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {message && <Text style={styles.ok}>{message}</Text>}

      <View style={styles.row}>
        <Text>Contact made</Text>
        <Switch value={contactMade} onValueChange={setContactMade} />
      </View>

      <Text style={styles.label}>Expected Saturday attendance</Text>
      {(['yes', 'no', 'maybe', 'unknown'] as const).map((value) => (
        <Pressable
          key={value}
          style={[
            styles.chip,
            expectedToAttend === value && styles.chipActive,
          ]}
          onPress={() => setExpectedToAttend(value)}
        >
          <Text>{value}</Text>
        </Pressable>
      ))}

      {DEFAULT_WEEKLY_REPORT_FIELDS.map((field) => (
        <View key={field.key}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            multiline
            value={responses[field.key] ?? ''}
            onChangeText={(text) =>
              setResponses((prev) => ({ ...prev, [field.key]: text }))
            }
          />
        </View>
      ))}

      <Pressable style={styles.primary} onPress={() => void onSubmit()}>
        <Text style={styles.primaryText}>Submit weekly report</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  lede: { fontSize: 20, fontWeight: '600', color: '#14232D' },
  meta: { color: '#3A5160' },
  label: { fontWeight: '600', marginTop: 8, color: '#1B3A4B' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#1B3A4B',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  chipActive: { backgroundColor: '#E8C547' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(20,35,45,0.12)',
    padding: 12,
    minHeight: 80,
  },
  primary: {
    backgroundColor: '#C45C26',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  error: { color: '#8B1E1E' },
  ok: { color: '#1F5C45' },
});
