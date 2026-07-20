import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '../src/lib/session';

export default function SignInScreen() {
  const { signIn, user, account, loading, error } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!loading && user && account) {
    return <Redirect href="/(app)/follow-up" />;
  }

  async function onSubmit() {
    setSubmitting(true);
    setLocalError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>IEEC YA Connect</Text>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.lede}>
        Minister operations on the shared Firebase backend (React Native
        Firebase).
      </Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      {(localError || error) && (
        <Text style={styles.error}>{localError || error}</Text>
      )}
      <Pressable
        style={styles.button}
        onPress={() => void onSubmit()}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F3EFE6',
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B3A4B',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#14232D',
    marginBottom: 8,
  },
  lede: {
    color: '#3A5160',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(20,35,45,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#C45C26',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  error: {
    color: '#8B1E1E',
    marginBottom: 8,
  },
});
