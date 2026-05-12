import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamilies, fontSizes } from '../../src/theme';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Settings</Text>
      </View>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Account, subscription, birth data — coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  header: {
    padding: 24,
    paddingTop: 64,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBlack,
  },
  heading: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    margin: 16,
    borderWidth: 2,
    borderColor: colors.borderBlack,
  },
  placeholderText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
});
