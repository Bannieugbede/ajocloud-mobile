import { useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { markIntroductionComplete } from '@/services/onboarding-preferences';
import { fontSizes, radius, sizes, spacing } from '@/theme';

const slides = [
  {
    key: 'ajo',
    symbol: 'A',
    title: 'Contribute together. Receive on schedule.',
    body: 'Create or join daily, weekly, and monthly Ajo savings groups. Track contributions and your payout position.',
  },
  {
    key: 'food',
    symbol: 'F',
    title: 'Plan food savings with your community.',
    body: 'Contribute towards clearly described food packages coordinated for convenient delivery or collection.',
  },
  {
    key: 'akawo',
    symbol: 'K',
    title: 'Turn personal goals into steady progress.',
    body: 'Build an Akawo goal for rent, education, business, travel, or another milestone and follow your progress.',
  },
] as const;

type IntroductionScreenProps = { onComplete: () => void };

export function IntroductionScreen({ onComplete }: IntroductionScreenProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, sizes.contentMaxWidth);
  const listRef = useRef<FlatList<(typeof slides)[number]>>(null);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState(false);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setStorageError(false);
    try {
      await markIntroductionComplete();
      onComplete();
    } catch {
      setStorageError(true);
      setSaving(false);
    }
  };

  const next = () => {
    if (index === slides.length - 1) void finish();
    else {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      listRef.current?.scrollToIndex({ animated: true, index: nextIndex });
    }
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topRow}>
        <AppButton label="Skip introduction" variant="ghost" onPress={() => void finish()} />
        <AppText accessibilityLiveRegion="polite" style={{ color: colors.textMuted }}>
          {index + 1} of {slides.length}
        </AppText>
      </View>
      <View
        accessibilityLabel={`Introduction progress, step ${index + 1} of ${slides.length}`}
        style={styles.progress}
      >
        {slides.map((slide, slideIndex) => (
          <View
            key={slide.key}
            style={[
              styles.dot,
              {
                backgroundColor: slideIndex === index ? colors.primary : colors.border,
                flex: slideIndex === index ? 3 : 1,
              },
            ]}
          />
        ))}
      </View>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.key}
        onMomentumScrollEnd={onMomentumScrollEnd}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, itemIndex) => ({
          length: pageWidth,
          offset: pageWidth * itemIndex,
          index: itemIndex,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: pageWidth }]}>
            <View
              style={[
                styles.visual,
                { backgroundColor: colors.primarySoft, borderColor: colors.primary },
              ]}
            >
              <View style={[styles.symbol, { backgroundColor: colors.primary }]}>
                <AppText weight="bold" style={[styles.symbolText, { color: colors.textInverse }]}>
                  {item.symbol}
                </AppText>
              </View>
            </View>
            <AppText accessibilityRole="header" weight="bold" style={styles.title}>
              {item.title}
            </AppText>
            <AppText style={[styles.body, { color: colors.textMuted }]}>{item.body}</AppText>
          </View>
        )}
      />
      <View style={styles.footer}>
        {storageError ? (
          <AppText accessibilityLiveRegion="assertive" style={{ color: colors.error }}>
            We could not save your introduction progress. Please try again.
          </AppText>
        ) : null}
        <AppButton
          label={index === slides.length - 1 ? 'Get started' : 'Next'}
          loading={saving}
          onPress={next}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  progress: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: 180,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  dot: { borderRadius: radius.pill, height: 8 },
  slide: { gap: spacing.lg, padding: spacing.lg },
  visual: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 280,
  },
  symbol: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  symbolText: { fontSize: 42 },
  title: { fontSize: fontSizes.heading, lineHeight: 38 },
  body: { fontSize: fontSizes.body, lineHeight: 25 },
  footer: { gap: spacing.sm, padding: spacing.lg },
});
