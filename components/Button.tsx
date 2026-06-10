import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { theme, useColors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';

type Variant = 'primary' | 'dark' | 'danger' | 'ghost' | 'white';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  pulse?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptics?: boolean;
  sound?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'white',
  size = 'md',
  pulse = false,
  disabled = false,
  style,
  textStyle,
  haptics = true,
  sound = true,
}: Props) {
  const c = useColors();
  const press = useSharedValue(0);
  const pulseV = useSharedValue(1);

  React.useEffect(() => {
    if (pulse) {
      pulseV.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        false,
      );
    } else {
      pulseV.value = withTiming(1);
    }
  }, [pulse, pulseV]);

  const animStyle = useAnimatedStyle(() => {
    const shift = press.value * 3;
    return {
      transform: [
        { translateX: shift },
        { translateY: shift },
        { scale: pulseV.value },
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    return { opacity: 1 - press.value };
  });

  const onIn = useCallback(() => {
    press.value = withTiming(1, { duration: 70 });
  }, [press]);
  const onOut = useCallback(() => {
    press.value = withTiming(0, { duration: 90 });
  }, [press]);

  const handlePress = useCallback(() => {
    if (haptics) haptic.tap();
    if (sound) playSound('ui');
    onPress?.();
  }, [haptics, sound, onPress]);

  // bg adapta ao tema; "dark"/"danger"/"primary" são fixas porque a cor faz parte da identidade
  const bg =
    variant === 'primary'
      ? c.accent
      : variant === 'dark'
        ? '#1A1A1A'
        : variant === 'danger'
          ? c.danger
          : variant === 'ghost'
            ? 'transparent'
            : c.surface;

  // texto: branco em cima de fundos escuros/coloridos, ink dinâmico nos demais
  const fg =
    variant === 'primary'
      ? '#1A1A1A'
      : variant === 'dark' || variant === 'danger'
        ? '#FFFFFF'
        : c.ink;

  // borda e sombra ficam visíveis nos dois temas
  const borderColor = c.border;
  const shadowColor = c.border;

  const padV = size === 'sm' ? 10 : 16;
  const padH = size === 'sm' ? 14 : 22;
  const fontSize = size === 'sm' ? 13 : 16;
  const radius = size === 'sm' ? 12 : theme.radius.lg;

  return (
    <Animated.View style={[{ position: 'relative' }, style]}>
      {variant !== 'ghost' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shadow,
            {
              borderRadius: radius,
              top: 4,
              left: 4,
              backgroundColor: shadowColor,
            },
            shadowStyle,
          ]}
        />
      )}
      <Animated.View style={animStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={onIn}
          onPressOut={onOut}
          disabled={disabled}
          style={[
            styles.btn,
            {
              backgroundColor: bg,
              borderColor,
              paddingVertical: padV,
              paddingHorizontal: padH,
              borderRadius: radius,
              borderStyle: variant === 'ghost' ? 'dashed' : 'solid',
              borderWidth: variant === 'ghost' ? 2 : 2.5,
              opacity: disabled ? 0.45 : 1,
            },
          ]}
        >
          <Text style={[styles.txt, { color: fg, fontSize }, textStyle]}>
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  txt: {
    fontFamily: theme.font.bodyHeavy,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
});
