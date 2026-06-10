import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { useColors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';

type Props = {
  on: boolean;
  onChange: (v: boolean) => void;
};

export function Toggle({ on, onChange }: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        playSound('ui');
        onChange(!on);
      }}
    >
      <MotiView
        animate={{ backgroundColor: on ? c.accent : c.grayMid }}
        transition={{ type: 'timing', duration: 200 }}
        style={[styles.toggle, { borderColor: c.border }]}
      >
        <MotiView
          animate={{ translateX: on ? 24 : 0 }}
          transition={{ type: 'timing', duration: 200 }}
          style={[
            styles.toggleKnob,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        />
      </MotiView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: 54,
    height: 30,
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 999,
  },
});
