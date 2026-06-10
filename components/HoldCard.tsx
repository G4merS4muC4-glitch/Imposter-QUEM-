import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Accelerometer } from 'expo-sensors';
import { theme } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';

const HOLD_MS = 700;

type Props = {
  back: React.ReactNode;
  front: React.ReactNode;
  cardBg: string;
  cardText: string;
  revealed: boolean;
  onReveal: () => void;
  onUnreveal: () => void;
};

export function HoldCard({
  back,
  front,
  cardBg,
  cardText,
  revealed,
  onReveal,
  onUnreveal,
}: Props) {
  const hold = useSharedValue(0);
  const flip = useSharedValue(revealed ? 1 : 0);
  const shake = useSharedValue(0);
  const handY = useSharedValue(0);
  // tilt 3D — driven by device accelerometer
  const tiltX = useSharedValue(0); // pitch (rotação no eixo X)
  const tiltY = useSharedValue(0); // roll (rotação no eixo Y)

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        // No iOS, permissão de Motion pode ser necessária — pede explicitamente
        await Accelerometer.requestPermissionsAsync().catch(() => {});
        const available = await Accelerometer.isAvailableAsync().catch(
          () => false,
        );
        if (!available || cancelled) return;
        Accelerometer.setUpdateInterval(60);
        sub = Accelerometer.addListener(({ x, y }) => {
          // x: -1..1 (positivo quando inclina à direita)
          // y: -1..1 (positivo quando inclina pra cima)
          const targetY = Math.max(-1, Math.min(1, x)) * 12;
          const targetX = Math.max(-1, Math.min(1, -y)) * 8;
          tiltY.value = withTiming(targetY, { duration: 180 });
          tiltX.value = withTiming(targetX, { duration: 180 });
        });
      } catch {
        // sem acelerômetro disponível — card simplesmente não inclina
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [tiltX, tiltY]);

  useEffect(() => {
    handY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(handY);
  }, [handY]);

  useEffect(() => {
    flip.value = withTiming(revealed ? 1 : 0, {
      duration: 550,
      easing: Easing.bezier(0.6, 0.2, 0.2, 1),
    });
  }, [revealed, flip]);

  const fireReveal = useCallback(() => {
    haptic.medium();
    playSound('reveal');
    onReveal();
  }, [onReveal]);

  const onPressIn = useCallback(() => {
    if (revealed) return;
    haptic.tap();
    hold.value = withTiming(1, { duration: HOLD_MS }, (finished) => {
      if (finished) runOnJS(fireReveal)();
    });
  }, [hold, revealed, fireReveal]);

  const onPressOut = useCallback(() => {
    if (revealed) return;
    if (hold.value < 1) {
      cancelAnimation(hold);
      hold.value = withTiming(0, { duration: 200 });
      shake.value = withSequence(
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-4, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
  }, [hold, revealed, shake]);

  const onTap = useCallback(() => {
    if (revealed) {
      onUnreveal();
      haptic.tap();
      playSound('ui');
    }
  }, [revealed, onUnreveal]);

  // Single rotation source — both faces use backfaceVisibility:hidden so we
  // never need to manually toggle opacity at the midpoint.
  // Tilt 3D do acelerômetro é multiplicado pelo "quanto o card está virado"
  // pra que ambas as faces respondam corretamente à inclinação.
  const backAnim = useAnimatedStyle(() => ({
    transform: [
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${flip.value * 180 + tiltY.value}deg` },
      { translateX: shake.value },
    ],
  }));

  const frontAnim = useAnimatedStyle(() => ({
    transform: [
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${flip.value * 180 + 180 + tiltY.value}deg` },
      { translateX: shake.value },
    ],
  }));

  const barAnim = useAnimatedStyle(() => ({
    width: `${hold.value * 100}%`,
  }));

  const handAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: handY.value }],
  }));

  return (
    <View style={styles.stage}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onTap}
        delayLongPress={9999}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Back face — closed card */}
        <Animated.View
          style={[styles.face, { backgroundColor: cardBg }, backAnim]}
        >
          <Animated.Text style={[styles.hand, handAnim]}>👆</Animated.Text>
          <Text style={[styles.lbl, { color: cardText }]}>
            SEGURE PARA REVELAR
          </Text>
          <Text style={[styles.sublbl, { color: cardText }]}>
            Mantenha o dedo no card
          </Text>
          {back}
          <View style={styles.barTrack}>
            <Animated.View style={[styles.barFill, barAnim]} />
          </View>
        </Animated.View>

        {/* Front face — revealed content */}
        <Animated.View
          style={[styles.face, styles.faceFront, frontAnim]}
          pointerEvents={revealed ? 'auto' : 'none'}
        >
          {front}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    aspectRatio: 3 / 4,
    alignSelf: 'center',
    maxWidth: 320,
    // perspective lives on the stage so both faces share the same 3D camera
    transform: [{ perspective: 1200 }],
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.radius.xxl,
    borderWidth: 3,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  faceFront: {
    backgroundColor: theme.colors.white,
  },
  hand: { fontSize: 64 },
  lbl: {
    fontFamily: theme.font.display,
    fontSize: 26,
    letterSpacing: 2,
    marginTop: 14,
    textAlign: 'center',
  },
  sublbl: {
    fontFamily: theme.font.body,
    fontSize: 12,
    marginTop: 6,
    opacity: 0.75,
    textAlign: 'center',
  },
  barTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  barFill: {
    height: 6,
    backgroundColor: theme.colors.ink,
  },
});
