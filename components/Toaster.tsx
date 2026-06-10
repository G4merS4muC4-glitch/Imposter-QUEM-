import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/lib/toast';
import { theme } from '@/lib/theme';

const bgFor = (kind: string) =>
  kind === 'success'
    ? theme.colors.success
    : kind === 'error'
      ? theme.colors.danger
      : kind === 'warning'
        ? theme.colors.warning
        : theme.colors.ink;

const fgFor = (kind: string) =>
  kind === 'warning' ? theme.colors.ink : theme.colors.white;

export function Toaster() {
  const items = useToast((s) => s.items);
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + 8 }]}
    >
      {items.map((t) => (
        <MotiView
          key={t.id}
          from={{ opacity: 0, translateY: -30 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -30 }}
          transition={{ type: 'timing', duration: 240 }}
          style={[styles.toast, { backgroundColor: bgFor(t.kind) }]}
        >
          <Text
            style={[styles.txt, { color: fgFor(t.kind) }]}
            numberOfLines={2}
          >
            {t.msg}
          </Text>
        </MotiView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
    zIndex: 60,
  },
  toast: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    maxWidth: '90%',
  },
  txt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    textAlign: 'center',
  },
});
