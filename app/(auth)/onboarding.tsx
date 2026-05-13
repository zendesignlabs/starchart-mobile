import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontFamilies, fontSizes, spacing } from '../../src/theme';
import * as ephemeris from '../../src/lib/ephemeris';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlaceResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface FormState {
  name: string;
  // Step 2
  birthDate: string;   // YYYY-MM-DD
  birthTime: string;   // HH:MM  or empty if unknown
  timeUnknown: boolean;
  // Step 3
  placeName: string;
  lat: number | null;
  lng: number | null;
}

interface StoredProfile {
  name: string;
  birthDatetime: string;
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  timeUnknown?: boolean;
  createdAt?: string;
}

const TOTAL_STEPS = 3;
const STORAGE_KEY = '@starchart/profile';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isStep1Complete(form: FormState) {
  return form.name.trim().length > 0;
}

function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > new Date().getFullYear()) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year
    && d.getUTCMonth() === month - 1
    && d.getUTCDate() === day;
}

function isValidBirthTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function isStep2Complete(form: FormState) {
  if (!isValidBirthDate(form.birthDate)) return false;
  if (!form.timeUnknown && !isValidBirthTime(form.birthTime)) return false;
  return true;
}

function isStep3Complete(form: FormState) {
  return form.lat !== null && form.lng !== null && form.placeName.length > 0;
}

function isStepComplete(step: number, form: FormState) {
  if (step === 1) return isStep1Complete(form);
  if (step === 2) return isStep2Complete(form);
  if (step === 3) return isStep3Complete(form);
  return false;
}

function formatDateForStorage(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeForStorage(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

function formatDateForDisplay(value: string): string {
  if (!isValidBirthDate(value)) return 'Choose date';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeForDisplay(value: string): string {
  if (!isValidBirthTime(value)) return 'Choose time';
  const [hour, minute] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function datePickerValue(value: string): Date {
  if (!isValidBirthDate(value)) return new Date(1990, 0, 1);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function timePickerValue(value: string): Date {
  const d = new Date();
  if (isValidBirthTime(value)) {
    const [hour, minute] = value.split(':').map(Number);
    d.setHours(hour, minute, 0, 0);
  } else {
    d.setHours(12, 0, 0, 0);
  }
  return d;
}

function buildISO(date: string, time: string, timeUnknown: boolean): string {
  if (timeUnknown || !time) {
    return `${date}T12:00:00.000Z`;
  }
  return `${date}T${time}:00.000Z`;
}

function profileToForm(profile: StoredProfile): FormState {
  const [datePart, timePart = ''] = profile.birthDatetime.split('T');
  const time = timePart.slice(0, 5);
  const timeUnknown = profile.timeUnknown ?? false;

  return {
    name: profile.name,
    birthDate: datePart,
    birthTime: timeUnknown ? '' : time,
    timeUnknown,
    placeName: profile.birthPlace,
    lat: profile.birthLat,
    lng: profile.birthLng,
  };
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepName({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.label}>Your name</Text>
      <TextInput
        style={stepStyles.largeInput}
        value={form.name}
        onChangeText={(v) => setForm({ ...form, name: v })}
        placeholder="Full name or nickname"
        placeholderTextColor={colors.textSecondary}
        autoFocus
        autoCapitalize="words"
        returnKeyType="next"
      />
    </View>
  );
}

function StepDateTime({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  function handleDatePicked(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selected) return;
    setForm({ ...form, birthDate: formatDateForStorage(selected) });
  }

  function handleTimePicked(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (event.type === 'dismissed' || !selected) return;
    setForm({ ...form, birthTime: formatTimeForStorage(selected), timeUnknown: false });
  }

  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.label}>When were you born?</Text>

      <Text style={stepStyles.sublabel}>Birth date</Text>
      <TouchableOpacity
        style={stepStyles.pickerButton}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.85}
      >
        <Text style={stepStyles.pickerButtonText}>{formatDateForDisplay(form.birthDate)}</Text>
        <Text style={stepStyles.pickerButtonIcon}>▾</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={datePickerValue(form.birthDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={handleDatePicked}
        />
      )}

      {!form.timeUnknown && (
        <>
          <Text style={[stepStyles.sublabel, { marginTop: spacing.base }]}>Birth time</Text>
          <TouchableOpacity
            style={stepStyles.pickerButton}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.85}
          >
            <Text style={stepStyles.pickerButtonText}>{formatTimeForDisplay(form.birthTime)}</Text>
            <Text style={stepStyles.pickerButtonIcon}>▾</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={timePickerValue(form.birthTime)}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              is24Hour={false}
              onChange={handleTimePicked}
            />
          )}
        </>
      )}

      <TouchableOpacity
        style={[stepStyles.toggle, form.timeUnknown && stepStyles.toggleActive]}
        onPress={() => setForm({ ...form, timeUnknown: !form.timeUnknown, birthTime: '' })}
        activeOpacity={0.8}
      >
        <View style={[stepStyles.checkbox, form.timeUnknown && stepStyles.checkboxChecked]} />
        <Text style={stepStyles.toggleLabel}>I don't know my birth time</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepPlace({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'starchart-mobile/1.0' },
      });
      const data: PlaceResult[] = await res.json();
      setResults(data);
    } catch {
      setSearchError('Search failed. Check your connection.');
    } finally {
      setSearching(false);
    }
  }, []);

  function handleQueryChange(v: string) {
    setQuery(v);
    // Clear selection if user edits after picking
    if (form.placeName) {
      setForm({ ...form, placeName: '', lat: null, lng: null });
    }
    if (v.trim().length >= 2) {
      search(v);
    } else {
      setResults([]);
    }
  }

  function handleSelect(place: PlaceResult) {
    setForm({
      ...form,
      placeName: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
    });
    setQuery(place.display_name);
    setResults([]);
  }

  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.label}>Where were you born?</Text>
      <View style={stepStyles.searchRow}>
        <TextInput
          style={[stepStyles.input, { flex: 1 }]}
          value={query}
          onChangeText={handleQueryChange}
          placeholder="City, country…"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          returnKeyType="search"
        />
        {searching && <ActivityIndicator style={{ marginLeft: spacing.sm }} color={colors.textPrimary} />}
      </View>
      {searchError ? <Text style={stepStyles.errorText}>{searchError}</Text> : null}

      {results.length > 0 && (
        <View style={placeStyles.resultsList}>
          {results.map((place, i) => (
            <TouchableOpacity
              key={i}
              style={[placeStyles.resultRow, i < results.length - 1 && placeStyles.resultRowBorder]}
              onPress={() => handleSelect(place)}
              activeOpacity={0.75}
            >
              <Text style={placeStyles.resultText} numberOfLines={2}>{place.display_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {form.placeName ? (
        <View style={placeStyles.selectedBadge}>
          <Text style={placeStyles.selectedText} numberOfLines={1}>
            {form.placeName}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isEditingBirthData = params.mode === 'editBirthData';
  const [step, setStep] = useState(isEditingBirthData ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<FormState>({
    name: '',
    birthDate: '',
    birthTime: '',
    timeUnknown: false,
    placeName: '',
    lat: null,
    lng: null,
  });

  const canAdvance = isStepComplete(step, form);

  useEffect(() => {
    if (!isEditingBirthData) return;

    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      const profile: StoredProfile = JSON.parse(raw);
      setForm(profileToForm(profile));
      setStep(2);
    });
  }, [isEditingBirthData]);

  async function handleFinish() {
    if (!canAdvance) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const isoDatetime = buildISO(form.birthDate, form.birthTime, form.timeUnknown);
      const chartData = await ephemeris.calculateChart(isoDatetime, form.lat!, form.lng!);
      const existingRaw = await AsyncStorage.getItem(STORAGE_KEY);
      const existingProfile = existingRaw ? JSON.parse(existingRaw) : null;
      const profile = {
        ...existingProfile,
        name: form.name.trim(),
        birthDatetime: isoDatetime,
        birthPlace: form.placeName,
        birthLat: form.lat!,
        birthLng: form.lng!,
        timeUnknown: form.timeUnknown,
        chartData,
        createdAt: existingProfile?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      router.replace('/(app)/');
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handleFinish();
  }

  function handleBack() {
    if (isEditingBirthData && step === 2) {
      router.replace('/(app)/settings');
      return;
    }
    if (step > 1) setStep(step - 1);
  }

  const stepLabel = isEditingBirthData
    ? `Birth data · ${step === 2 ? 'Date & time' : 'Place'}`
    : `Step ${step} of ${TOTAL_STEPS}`;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>STARCHART</Text>
        <Text style={styles.stepLabel}>{stepLabel}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {/* Step content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!isEditingBirthData && step === 1 && <StepName form={form} setForm={setForm} />}
        {step === 2 && <StepDateTime form={form} setForm={setForm} />}
        {step === 3 && <StepPlace form={form} setForm={setForm} />}

        {submitError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 1 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <TouchableOpacity
          style={[styles.nextBtn, !canAdvance && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canAdvance || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === TOTAL_STEPS ? (isEditingBirthData ? 'Save' : 'Begin') : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBlack,
  },
  appName: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  stepLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBlack,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentYellow,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingTop: spacing['2xl'],
  },
  errorBanner: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.accentPink,
  },
  errorBannerText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  navRow: {
    flexDirection: 'row',
    padding: spacing.base,
    borderTopWidth: 2,
    borderTopColor: colors.borderBlack,
    gap: spacing.md,
  },
  backBtn: {
    flex: 1,
    padding: spacing.base,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  backBtnText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  nextBtn: {
    flex: 2,
    padding: spacing.base,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    alignItems: 'center',
    backgroundColor: colors.accentYellow,
  },
  nextBtnDisabled: {
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.5,
  },
  nextBtnText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
});

const stepStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  sublabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    padding: spacing.md,
    backgroundColor: colors.backgroundPrimary,
  },
  pickerButton: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  pickerButtonIcon: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  largeInput: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    padding: spacing.base,
    width: '100%',
    backgroundColor: colors.backgroundPrimary,
  },
  errorText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: colors.accentPink,
    marginTop: spacing.xs,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
  },
  toggleActive: {
    backgroundColor: colors.accentYellow,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
  },
  checkboxChecked: {
    backgroundColor: colors.textPrimary,
  },
  toggleLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const placeStyles = StyleSheet.create({
  resultsList: {
    borderWidth: 2,
    borderColor: colors.borderBlack,
    borderTopWidth: 0,
    backgroundColor: colors.backgroundPrimary,
    marginTop: 0,
  },
  resultRow: {
    padding: spacing.md,
  },
  resultRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBlack,
  },
  resultText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  selectedBadge: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.accentYellow,
  },
  selectedText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
});
