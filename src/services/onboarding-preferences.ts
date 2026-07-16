import AsyncStorage from '@react-native-async-storage/async-storage';

const INTRODUCTION_COMPLETE_KEY = 'ajo-cloud.introduction-complete.v1';

export async function markIntroductionComplete(): Promise<void> {
  await AsyncStorage.setItem(INTRODUCTION_COMPLETE_KEY, 'true');
}

export async function hasCompletedIntroduction(): Promise<boolean> {
  return (await AsyncStorage.getItem(INTRODUCTION_COMPLETE_KEY)) === 'true';
}
