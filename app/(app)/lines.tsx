import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamilies, fontSizes, spacing } from '../../src/theme';
import {
  interpretations,
  PLANETS_ORDER,
  ANGLES_ORDER,
  type Interpretation,
} from '../../src/data/interpretations';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text.slice(0, 100) + '…';
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}

function parseTitle(interp: Interpretation): { planet: string; angle: string } {
  // e.g. "sun-ac" → { planet: "Sun", angle: "AC" }
  const parts = interp.triggerKey.split('-');
  if (parts.length === 2) {
    return { planet: capitalize(parts[0]), angle: parts[1].toUpperCase() };
  }
  return { planet: interp.title, angle: '' };
}

function mapParamsForInterpretation(interp: Interpretation): { planet: string; lineType: string } | null {
  if (interp.category !== 'planet_angle') return null;
  const [planet, angle] = interp.triggerKey.split('-');
  if (!planet || !angle) return null;
  const lineType = angle.toUpperCase() === 'DSC' ? 'DC' : angle.toUpperCase();
  return { planet, lineType };
}

// ─── Grouped data ─────────────────────────────────────────────────────────────

interface Group {
  label: string;
  items: Interpretation[];
}

function buildGroups(): Group[] {
  const groups: Group[] = [];

  // Four angle macros first
  const angleGroup: Interpretation[] = [];
  for (const key of ANGLES_ORDER) {
    const match = interpretations.find((i) => i.triggerKey === key);
    if (match) angleGroup.push(match);
  }
  if (angleGroup.length) {
    groups.push({ label: 'Angles', items: angleGroup });
  }

  // Planet groups
  for (const planet of PLANETS_ORDER) {
    const items = interpretations.filter(
      (i) => i.category === 'planet_angle' && i.triggerKey.startsWith(planet + '-')
    );
    if (items.length) {
      groups.push({ label: capitalize(planet), items });
    }
  }

  return groups;
}

const GROUPS = buildGroups();

// ─── Row component ────────────────────────────────────────────────────────────

function InterpRow({
  interp,
  isExpanded,
  onPress,
  onViewMap,
}: {
  interp: Interpretation;
  isExpanded: boolean;
  onPress: () => void;
  onViewMap?: () => void;
}) {
  const { planet, angle } = parseTitle(interp);
  const isAngle = interp.category === 'angle';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.row, isExpanded && styles.rowExpanded]}
    >
      {isExpanded && <View style={styles.activeBorder} />}
      <View style={styles.rowInner}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle}>
            {isAngle ? interp.title : `${planet} ${angle}`}
          </Text>
          <Text style={styles.rowChevron}>{isExpanded ? '−' : '+'}</Text>
        </View>

        {!isExpanded && (
          <Text style={styles.rowPreview} numberOfLines={1}>
            {firstSentence(interp.body)}
          </Text>
        )}

        {isExpanded && (
          <>
            <Text style={styles.rowBody}>{interp.body}</Text>
            {onViewMap && (
              <TouchableOpacity
                style={styles.mapLink}
                onPress={onViewMap}
                activeOpacity={0.85}
              >
                <Text style={styles.mapLinkText}>Show this line on map →</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LinesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  function handleToggle(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key));
  }

  function handleViewMap(interp: Interpretation) {
    const params = mapParamsForInterpretation(interp);
    if (!params) return;
    router.push({
      pathname: '/(app)/',
      params,
    });
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 56 + insets.top }]}>
        <Text style={styles.heading}>YOUR LINES</Text>
        <Text style={styles.subheading}>Interpretations by planet and angle</Text>
      </View>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {GROUPS.map((group) => (
          <View key={group.label} style={styles.group}>
            <Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>
            {group.items.map((interp, i) => (
              <InterpRow
                key={interp.triggerKey}
                interp={interp}
                isExpanded={expandedKey === interp.triggerKey}
                onPress={() => handleToggle(interp.triggerKey)}
                onViewMap={interp.category === 'planet_angle' ? () => handleViewMap(interp) : undefined}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBlack,
  },
  heading: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subheading: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  group: {
    marginTop: spacing.xl,
  },
  groupLabel: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    letterSpacing: 2,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBlack,
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
  },
  rowExpanded: {
    backgroundColor: colors.backgroundSecondary,
  },
  activeBorder: {
    width: 4,
    backgroundColor: colors.accentYellow,
  },
  rowInner: {
    flex: 1,
    padding: spacing.base,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  rowTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  rowChevron: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  rowPreview: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rowBody: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  mapLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.accentYellow,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapLinkText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  }, 
});
