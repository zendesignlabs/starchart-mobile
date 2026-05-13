import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { colors, fontFamilies, fontSizes, spacing } from '../../src/theme';
import { createCheckoutSession } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth';

const FEATURES = [
  'Transit-activated ACG lines updated in real time',
  '52 interpretations for every planet × angle',
  'Your personal map — always, anywhere',
];

export default function PaywallScreen() {
  const { clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      // Deep link back into the app after Stripe checkout.
      // The (app) layout will re-check subscription status on focus.
      const { url } = await createCheckoutSession(
        'starchart://subscription/success',
        'starchart://subscription/cancel'
      );
      await Linking.openURL(url);
    } catch {
      Alert.alert('Something went wrong', 'Could not open checkout. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.wordmark}>Starchart</Text>
        <Text style={styles.headline}>Your map,{'\n'}activated.</Text>
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.bullet} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>$9.99</Text>
          <Text style={styles.priceSub}>per month · 7-day free trial</Text>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, loading && styles.ctaDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.ctaText}>Start free trial</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutLink} onPress={clearAuth}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    padding: spacing['2xl'],
    justifyContent: 'space-between',
  },
  top: {
    paddingTop: spacing['4xl'],
  },
  wordmark: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headline: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['3xl'],
    color: colors.textPrimary,
    lineHeight: fontSizes['3xl'] * 1.1,
    marginBottom: spacing['2xl'],
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBlack,
    paddingBottom: spacing['2xl'],
  },
  featureList: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    width: 8,
    height: 8,
    backgroundColor: colors.accentYellow,
    borderWidth: 1,
    borderColor: colors.borderBlack,
    marginTop: 5,
    flexShrink: 0,
  },
  featureText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: fontSizes.base * 1.5,
  },
  bottom: {
    gap: spacing.md,
  },
  priceBlock: {
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.accentYellow,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  price: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
  priceSub: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  ctaButton: {
    backgroundColor: colors.textPrimary,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderBlack,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.md,
    color: colors.backgroundPrimary,
  },
  signOutLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  signOutText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
