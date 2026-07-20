import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '../../src/lib/session';

export default function AppLayout() {
  const { loading, user, account } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user || !account) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F3EFE6' },
        headerTintColor: '#1B3A4B',
        contentStyle: { backgroundColor: '#F3EFE6' },
      }}
    />
  );
}
