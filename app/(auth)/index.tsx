import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontFamilies, fontSizes, spacing } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth';
import { signInWithApple, signInWithEmail } from '../../src/lib/api';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAppleSignIn() {
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });
      if (!credential.identityToken) throw new Error('No identity token');
      const { token, email: resolvedEmail } = await signInWithApple(
        credential.identityToken,
        credential.email ?? undefined
      );
      await setAuth(token, resolvedEmail);
      router.replace('/(app)/');
    } catch (err: any) {
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', 'Could not complete Apple Sign In. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSignIn() {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const { token, email: resolvedEmail } = await signInWithEmail(email.trim());
      await setAuth(token, resolvedEmail);
      router.replace('/(app)/');
    } catch {
      Alert.alert('Sign in failed', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.wordmark}>Starchart</Text>
        <Text style={styles.tagline}>Your map, right now.</Text>

        {Platform.OS === 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={0}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        ) : (
          <View style={styles.emailBlock}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleEmailSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.backgroundPrimary} />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {loading && Platform.OS === 'ios' && (
          <ActivityIndicator color={colors.textPrimary} style={{ marginTop: spacing.lg }} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  wordmark: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['4xl'],
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing['3xl'],
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBlack,
    paddingBottom: spacing.lg,
  },
  appleButton: {
    width: '100%',
    height: 52,
  },
  emailBlock: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: 52,
  },
  button: {
    backgroundColor: colors.textPrimary,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderBlack,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.md,
    color: colors.backgroundPrimary,
  },
});
