import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '../src/lib/session';

export default function Index() {
  const { loading, user, account } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (user && account) {
    return <Redirect href="/(app)/follow-up" />;
  }

  return <Redirect href="/sign-in" />;
}
