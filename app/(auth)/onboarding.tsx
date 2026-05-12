import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamilies, fontSizes } from '../../src/theme';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Birth Data</Text>
      <Text style={styles.body}>
        Enter your name, birth date, time, and place to generate your chart.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 24,
  },
  heading: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBlack,
    marginBottom: 16,
  },
  body: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
});
