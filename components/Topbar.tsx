import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { theme, useColors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';

type IconBtnProps = {
  icon: string;
  onPress: () => void;
  variant?: 'white' | 'danger' | 'dark' | 'accent';
};

function IconButton({ icon, onPress, variant = 'white' }: IconBtnProps) {
  const c = useColors();
  const press = useSharedValue(0);

  const onIn = useCallback(() => {
    press.value = withTiming(1, { duration: 70 });
  }, [press]);
  const onOut = useCallback(() => {
    press.value = withTiming(0, { duration: 90 });
  }, [press]);

  const animStyle = useAnimatedStyle(() => {
    const shift = press.value * 3;
    return { transform: [{ translateX: shift }, { translateY: shift }] };
  });
  const shadowStyle = useAnimatedStyle(() => ({ opacity: 1 - press.value }));

  const bg =
    variant === 'danger'
      ? c.danger
      : variant === 'dark'
        ? '#1A1A1A'
        : variant === 'accent'
          ? c.accent
          : c.surface;
  const fg =
    variant === 'danger' || variant === 'dark'
      ? '#FFFFFF'
      : variant === 'accent'
        ? '#1A1A1A'
        : c.ink;

  return (
    <View style={styles.iconBtnWrap}>
      <Animated.View
        style={[
          styles.iconBtnShadow,
          { backgroundColor: c.border },
          shadowStyle,
        ]}
      />
      <Animated.View style={animStyle}>
        <Pressable
          onPress={() => {
            haptic.tap();
            playSound('ui');
            onPress();
          }}
          onPressIn={onIn}
          onPressOut={onOut}
          style={[
            styles.iconBtn,
            { backgroundColor: bg, borderColor: c.border },
          ]}
        >
          <Text style={[styles.iconTxt, { color: fg }]}>{icon}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

type Props = {
  right?: React.ReactNode;
  onLeft?: () => void;
  leftIcon?: string;
  leftDanger?: boolean;
  leftVariant?: 'white' | 'danger' | 'dark' | 'accent';
};

export function Topbar({
  right,
  onLeft,
  leftIcon,
  leftDanger,
  leftVariant,
}: Props) {
  const router = useRouter();
  const c = useColors();
  const onLogo = () => {
    haptic.tap();
    playSound('ui');
    router.replace('/');
  };
  const variant = leftVariant ?? (leftDanger ? 'danger' : 'white');
  return (
    <View style={styles.bar}>
      <Pressable onPress={onLogo} style={styles.logoWrap}>
        <View style={[styles.logoShadow, { backgroundColor: c.border }]} />
        <View
          style={[
            styles.logo,
            { backgroundColor: c.accent, borderColor: c.border },
          ]}
        >
          <Text style={[styles.logoTxt, { color: '#1A1A1A' }]}>IMPOSTOR</Text>
        </View>
      </Pressable>
      {onLeft ? (
        <IconButton icon={leftIcon ?? '✕'} onPress={onLeft} variant={variant} />
      ) : null}
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  logoWrap: { position: 'relative' },
  logoShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  logo: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logoTxt: {
    fontFamily: theme.font.display,
    fontSize: 18,
    letterSpacing: 1,
  },
  iconBtnWrap: {
    position: 'relative',
    width: 42,
    height: 42,
  },
  iconBtnShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTxt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 18,
  },
});
