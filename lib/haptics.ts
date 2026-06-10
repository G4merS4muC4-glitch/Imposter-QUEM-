import * as Haptics from 'expo-haptics';
import { useGameStore } from './store';

export const haptic = {
  tap: () => {
    if (useGameStore.getState().mode === 'silent') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium: () => {
    if (useGameStore.getState().mode === 'silent') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  heavy: () => {
    if (useGameStore.getState().mode === 'silent') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
  success: () => {
    if (useGameStore.getState().mode === 'silent') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  },
  warning: () => {
    if (useGameStore.getState().mode === 'silent') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
  },
  error: () => {
    if (useGameStore.getState().mode === 'silent') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {},
    );
  },
};
