import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { theme, useColors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';

type Option<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
};

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const c = useColors();
  return (
    <View
      style={[
        styles.group,
        { backgroundColor: c.surfaceAlt, borderColor: c.border },
      ]}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => {
              haptic.tap();
              playSound('ui');
              onChange(o.id);
            }}
            style={[styles.pill, active ? { backgroundColor: c.ink } : null]}
          >
            <Text
              style={[
                styles.pillTxt,
                { color: active ? c.inkInverse : c.ink },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  pillTxt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
