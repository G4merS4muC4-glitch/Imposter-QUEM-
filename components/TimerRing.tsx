import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 200;
const STROKE = 10;
const R = (SIZE - STROKE) / 2 - 8;
const C = 2 * Math.PI * R;

type Props = {
  totalSeconds: number;
  remaining: number;
};

export function TimerRing({ totalSeconds, remaining }: Props) {
  const progress = useSharedValue(1);

  useEffect(() => {
    const target = totalSeconds > 0 ? remaining / totalSeconds : 0;
    progress.value = withTiming(target, { duration: 400 });
  }, [remaining, totalSeconds, progress]);

  const animatedProps = useAnimatedProps(() => {
    const stroke = interpolateColor(
      progress.value,
      [0, 0.25, 0.5, 1],
      [
        theme.colors.danger,
        theme.colors.danger,
        theme.colors.warning,
        theme.colors.success,
      ],
    );
    return {
      strokeDashoffset: C * (1 - progress.value),
      stroke,
    };
  });

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const label = `${mm}:${String(ss).padStart(2, '0')}`;

  return (
    <View style={styles.wrap}>
      <Svg
        width={SIZE}
        height={SIZE}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="#eaeaea"
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C.toFixed(2)} ${C.toFixed(2)}`}
          animatedProps={animatedProps as never}
        />
      </Svg>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    position: 'absolute',
    fontFamily: theme.font.display,
    fontSize: 50,
    letterSpacing: 1,
    color: theme.colors.ink,
  },
});
