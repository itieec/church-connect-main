import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, Stack } from 'expo-router';
import type { FollowUpAssignment, Person } from '@ieec/shared';
import { useSession } from '../../../src/lib/session';
import { getPerson, listMyAssignments } from '../../../src/modules/follow-up/api';

export default function AssignedListScreen() {
  const { account, person, can, signOutUser } = useSession();
  const [rows, setRows] = useState<
    Array<{ assignment: FollowUpAssignment; newcomer: Person | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account || !person) return;
    if (!can('follow_up.view') && !can('platform.admin') && !can('org.admin')) {
      setError('Missing follow_up.view permission.');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const assignments = await listMyAssignments(
          account.organizationId,
          person.id,
        );
        const enriched = await Promise.all(
          assignments.map(async (assignment) => ({
            assignment,
            newcomer: await getPerson(assignment.newcomerPersonId),
          })),
        );
        setRows(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [account, person, can]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My newcomers',
          headerRight: () => (
            <Pressable onPress={() => void signOutUser()}>
              <Text style={styles.link}>Sign out</Text>
            </Pressable>
          ),
        }}
      />
      <Text style={styles.brand}>IEEC YA Connect</Text>
      <Text style={styles.lede}>
        Report and Saturday attendance are separate actions.
      </Text>
      {loading && <ActivityIndicator />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.assignment.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              {item.newcomer
                ? `${item.newcomer.firstName} ${item.newcomer.lastName}`
                : item.assignment.newcomerPersonId}
            </Text>
            <Text style={styles.meta}>{item.assignment.assignmentType}</Text>
            <Link
              href={`/(app)/follow-up/${item.assignment.id}`}
              style={styles.link}
            >
              Open profile
            </Link>
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.meta}>No active assignments.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  brand: { fontSize: 20, fontWeight: '700', color: '#1B3A4B' },
  lede: { color: '#3A5160', marginVertical: 8 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: '600', color: '#14232D' },
  meta: { color: '#3A5160', marginTop: 4 },
  link: { color: '#C45C26', fontWeight: '600', marginTop: 8 },
  error: { color: '#8B1E1E', marginBottom: 8 },
});
