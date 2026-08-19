import { useCallback, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontFamilies, fontSizes, radius, sizes, spacing } from '@/theme';

import { onboardingSlides, type OnboardingSlide } from './onboarding-slides';

type OnboardingScreenProps = {
  /** Called when the last slide is confirmed or the flow is skipped. */
  onDone: () => void;
};

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === onboardingSlides.length - 1;

  // Track the settled page rather than every scroll frame, so the dots and the
  // action label only change once a slide is actually resting in view.
  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      setIndex((current) => (current === next ? current : next));
    },
    [width],
  );

  const advance = useCallback(() => {
    if (isLast) {
      onDone();
      return;
    }
    const next = index + 1;
    // Advance the visible state first: paging must never depend on the optional
    // announcement below succeeding.
    setIndex(next);
    listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    // Paging by button does not move screen-reader focus on its own. This is a
    // progressive enhancement, so a platform without it must not break paging.
    try {
      const slide = onboardingSlides[next];
      AccessibilityInfo.announceForAccessibility(
        `Step ${next + 1} of ${onboardingSlides.length}. ${slide.titleLead} ${slide.titleRest}`,
      );
    } catch {
      // Announcement is unavailable on this platform; paging already advanced.
    }
  }, [index, isLast, onDone, width]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        ref={listRef}
        testID="onboarding-carousel"
        data={onboardingSlides}
        keyExtractor={(slide) => slide.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        // Fixed page width keeps paging exact on rotation and large-font devices.
        getItemLayout={(_, itemIndex) => ({
          length: width,
          offset: width * itemIndex,
          index: itemIndex,
        })}
        renderItem={({ item }) => <Slide slide={item} width={width} />}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View
          accessible
          accessibilityLabel={`Step ${index + 1} of ${onboardingSlides.length}`}
          accessibilityRole="text"
          style={styles.dots}
          testID="onboarding-progress"
        >
          {onboardingSlides.map((slide, dotIndex) => (
            <View
              key={slide.key}
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={[
                styles.dot,
                {
                  backgroundColor: dotIndex === index ? colors.primary : colors.borderStrong,
                  width: dotIndex === index ? 26 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
            onPress={onDone}
            hitSlop={spacing.md}
            style={styles.skip}
            testID="onboarding-skip"
          >
            <AppText weight="medium" style={{ color: colors.textMuted }}>
              Skip
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Get started' : 'Next slide'}
            onPress={advance}
            testID="onboarding-advance"
            style={({ pressed }) => [
              styles.next,
              { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <AppText style={[styles.nextLabel, { color: colors.textInverse }]}>
              {isLast ? 'Get started' : 'Next'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Slide({ slide, width }: { slide: OnboardingSlide; width: number }) {
  const { colors } = useTheme();
  const { Illustration } = slide;
  // Art is capped so it never crowds the copy on small phones or stretches on tablets.
  const artSize = Math.min(width * 0.68, 300);

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.art}>
        <Illustration size={artSize} />
      </View>
      <View style={styles.copy}>
        <AppText accessibilityRole="header" style={styles.title}>
          <AppText weight="bold" style={[styles.title, { color: colors.primary }]}>
            {slide.titleLead}
          </AppText>{' '}
          {slide.titleRest}
        </AppText>
        <AppText style={[styles.caption, { color: colors.textMuted }]}>{slide.caption}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  art: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  copy: { alignSelf: 'center', gap: spacing.md, maxWidth: sizes.contentMaxWidth, width: '100%' },
  title: { fontSize: fontSizes.heading, lineHeight: 38 },
  caption: { fontSize: fontSizes.body, lineHeight: 25 },
  footer: { gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  dots: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  dot: { borderRadius: radius.pill, height: 8 },
  actions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  skip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
  },
  next: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    minWidth: 150,
    paddingHorizontal: spacing.xl,
  },
  nextLabel: { fontFamily: fontFamilies.semibold, fontSize: fontSizes.body },
});
