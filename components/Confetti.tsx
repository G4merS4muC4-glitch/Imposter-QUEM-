import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const COLORS = [
  '#FFD600',
  '#FF6B6B',
  '#4FC3F7',
  '#81C784',
  '#CE93D8',
  '#FFB74D',
  '#AAEE00',
  '#F06292',
];

function Piece({
  left,
  color,
  delay,
  rotateStart,
  duration,
  drift,
}: {
  left: number;
  color: string;
  delay: number;
  rotateStart: number;
  duration: number;
  drift: number;
}) {
  const ty = useSharedValue(-30);
  const rot = useSharedValue(rotateStart);

  React.useEffect(() => {
    const h = Dimensions.get('window').height + 100;
    ty.value = withDelay(
      delay,
      withTiming(h, { duration, easing: Easing.linear }),
    );
    rot.value = withDelay(
      delay,
      withTiming(rotateStart + 720, { duration, easing: Easing.linear }),
    );
  }, [delay, duration, rotateStart, ty, rot]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: `${left}%`, backgroundColor: color },
        aStyle,
      ]}
    />
  );
}

type Props = { active: boolean; count?: number };

export function Confetti({ active, count = 60 }: Props) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      key: i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length]!,
      delay: Math.random() * 800,
      rotateStart: Math.random() * 360,
      duration: 2400 + Math.random() * 1800,
      drift: (Math.random() - 0.5) * 80,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <Piece
          key={p.key}
          left={p.left}
          color={p.color}
          delay={p.delay}
          rotateStart={p.rotateStart}
          duration={p.duration}
          drift={p.drift}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 14,
    borderRadius: 2,
  },
});
