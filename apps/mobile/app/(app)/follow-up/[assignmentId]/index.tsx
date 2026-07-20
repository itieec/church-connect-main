import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import type {
  FollowUpAssignment,
  FollowUpReport,
  NewcomerAttendance,
  NewcomerBioEntry,
  NewcomerJourney,
  Person,
} from '@ieec/shared';
import { useSession } from '../../../../src/lib/session';
import {
  addBioEntry,
  getAssignment,
  getJourney,
  getPerson,
  listAttendanceForPerson,
  listBioEntries,
  listReportsForAssignment,
} from '../../../../src/modules/follow-up/api';

export default function NewcomerProfileScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { account, person, can } = useSession();
  const [assignment, setAssignment] = useState<FollowUpAssignment | null>(null);
  const [newcomer, setNewcomer] = useState<Person | null>(null);
  const [journey, setJourney] = useState<NewcomerJourney | null>(null);
  const [reports, setReports] = useState<FollowUpReport[]>([]);
  const [attendance, setAttendance] = useState<NewcomerAttendance[]>([]);
  const [bio, setBio] = useState<NewcomerBioEntry[]>([]);
  const [bioText, setBioText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload(a: FollowUpAssignment, organizationId: string) {
    const [p, j, r, att, b] = await Promise.all([
      getPerson(a.newcomerPersonId),
      getJourney(a.journeyId),
      listReportsForAssignment(organizationId, a.id),
      listAttendanceForPerson(organizationId, a.newcomerPersonId),
      listBioEntries(a.newcomerPersonId),
    ]);
    setNewcomer(p);
    setJourney(j);
    setReports(r);
    setAttendance(att);
    setBio(b);
  }

  useEffect(() => {
    if (!account || !assignmentId) return;
    void (async () => {
      try {
        const a = await getAssignment(assignmentId);
        setAssignment(a);
        if (a) await reload(a, account.organizationId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [account, assignmentId]);

  async function onAddBio() {
    if (!account || !person || !assignment || !bioText.trim()) return;
    if (!can('follow_up.bio.add') && !can('platform.admin')) {
      setError('Missing follow_up.bio.add');
      return;
    }
    await addBioEntry({
      organizationId: account.organizationId,
      personId: assignment.newcomerPersonId,
      journeyId: assignment.journeyId,
      actorPersonId: person.id,
      content: bioText.trim(),
    });
    setBioText('');
    await reload(assignment, account.organizationId);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          title: newcomer
            ? `${newcomer.firstName} ${newcomer.lastName}`
            : 'Profile',
        }}
      />
      {loading && <ActivityIndicator />}
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.meta}>
        Status: {newcomer?.currentMinistryStatus ?? '—'} · Journey:{' '}
        {journey?.journeyStatus ?? '—'}
      </Text>
      <View style={styles.row}>
        <Link href={`/(app)/follow-up/${assignmentId}/report`} style={styles.btn}>
          Weekly report
        </Link>
        <Link
          href={`/(app)/follow-up/${assignmentId}/attendance`}
          style={styles.btnSecondary}
        >
          Saturday attendance
        </Link>
      </View>

      <Text style={styles.heading}>Reports</Text>
      {reports.map((r) => (
        <Text key={r.id} style={styles.meta}>
          {r.reportStatus}
        </Text>
      ))}
      {reports.length === 0 && <Text style={styles.meta}>None yet</Text>}

      <Text style={styles.heading}>Attendance</Text>
      {attendance.map((a) => (
        <Text key={a.id} style={styles.meta}>
          {a.attendanceStatus} · {a.calendarEventId}
        </Text>
      ))}
      {attendance.length === 0 && <Text style={styles.meta}>None yet</Text>}

      <Text style={styles.heading}>Bio</Text>
      {bio.map((entry) => (
        <Text key={entry.id} style={styles.meta}>
          {entry.content}
        </Text>
      ))}
      <TextInput
        style={styles.input}
        placeholder="Add bio note"
        value={bioText}
        onChangeText={setBioText}
        multiline
      />
      <Pressable style={styles.primary} onPress={() => void onAddBio()}>
        <Text style={styles.primaryText}>Add bio entry</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  heading: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#1B3A4B',
  },
  meta: { color: '#3A5160' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  btn: {
    backgroundColor: '#C45C26',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '700',
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: '#1B3A4B',
    color: '#1B3A4B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '600',
  },
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  error: { color: '#8B1E1E' },
});
