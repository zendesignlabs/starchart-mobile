import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamilies, fontSizes } from '../../src/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Starchart</Text>
      <Text style={styles.body}>Welcome — Log in or create an account.</Text>
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
    fontSize: fontSizes['3xl'],
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
