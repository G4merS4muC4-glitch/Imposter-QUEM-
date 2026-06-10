import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

type Props = {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
};

const KNOB_SIZE = 28;
const TRACK_HEIGHT = 8;

export function Slider({ min, max, step = 1, value, onChange }: Props) {
  const trackWidth = useSharedValue(0);
  const knobX = useSharedValue(0);
  const lastSnapped = useSharedValue(value);

  const positionFor = useCallback(
    (v: number, w: number) => ((v - min) / (max - min)) * (w - KNOB_SIZE),
    [min, max],
  );

  // Whenever the external value changes (e.g. from setMusicOn flipping minutes),
  // pull the knob to the matching position.
  useEffect(() => {
    if (trackWidth.value > 0) {
      knobX.value = withSpring(positionFor(value, trackWidth.value), {
        damping: 16,
      });
    }
  }, [value, positionFor, trackWidth, knobX]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidth.value = w;
    knobX.value = positionFor(value, w);
  };

  const snapToStep = (px: number) => {
    'worklet';
    const w = trackWidth.value;
    if (w <= 0) return value;
    const ratio = Math.max(0, Math.min(1, px / (w - KNOB_SIZE)));
    const raw = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, snapped));
  };

  const emit = (v: number) => {
    if (v !== lastSnapped.value) {
      lastSnapped.value = v;
      haptic.tap();
      onChange(v);
    }
  };

  const pan = Gesture.Pan()
    .onBegin((e) => {
      knobX.value = Math.max(
        0,
        Math.min(trackWidth.value - KNOB_SIZE, e.x - KNOB_SIZE / 2),
      );
      const v = snapToStep(knobX.value);
      runOnJS(emit)(v);
    })
    .onUpdate((e) => {
      knobX.value = Math.max(
        0,
        Math.min(trackWidth.value - KNOB_SIZE, e.x - KNOB_SIZE / 2),
      );
      const v = snapToStep(knobX.value);
      runOnJS(emit)(v);
    })
    .onEnd(() => {
      const v = snapToStep(knobX.value);
      runOnJS(emit)(v);
      // snap visualmente para o valor escolhido
      knobX.value = withSpring(positionFor(v, trackWidth.value), {
        damping: 16,
      });
    });

  const tap = Gesture.Tap().onStart((e) => {
    knobX.value = withSpring(
      Math.max(
        0,
        Math.min(trackWidth.value - KNOB_SIZE, e.x - KNOB_SIZE / 2),
      ),
      { damping: 16 },
    );
    const v = snapToStep(e.x - KNOB_SIZE / 2);
    runOnJS(emit)(v);
  });

  const gesture = Gesture.Simultaneous(pan, tap);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobX.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: knobX.value + KNOB_SIZE / 2,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.touchArea} onLayout={onTrackLayout}>
        <View style={styles.trackBg} />
        <Animated.View style={[styles.trackFill, fillStyle]} />
        <Animated.View style={[styles.knob, knobStyle]}>
          <View style={styles.knobInner} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    height: 44,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    height: TRACK_HEIGHT,
    backgroundColor: '#e6e6e6',
    borderRadius: TRACK_HEIGHT,
    borderWidth: 2,
    borderColor: theme.colors.ink,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    backgroundColor: theme.colors.accent,
    borderRadius: TRACK_HEIGHT,
    borderWidth: 2,
    borderColor: theme.colors.ink,
  },
  knob: {
    position: 'absolute',
    top: (44 - KNOB_SIZE) / 2,
    left: 0,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobInner: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: theme.colors.white,
    borderWidth: 2.5,
    borderColor: theme.colors.ink,
  },
});
