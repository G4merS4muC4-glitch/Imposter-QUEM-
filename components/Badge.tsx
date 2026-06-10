import React from 'react';
import { StyleSheet, View, Text, type ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

type Props = {
  label: string;
  bg?: string;
  color?: string;
  small?: boolean;
  style?: ViewStyle;
};

export function Badge({
  label,
  bg = theme.colors.white,
  color = theme.colors.ink,
  small,
  style,
}: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.shadow,
          { borderRadius: 999 },
          { top: small ? 2 : 3, left: small ? 2 : 3 },
        ]}
      />
      <View
        style={[
          styles.body,
          {
            backgroundColor: bg,
            paddingVertical: small ? 4 : 6,
            paddingHorizontal: small ? 8 : 12,
          },
        ]}
      >
        <Text
          style={[styles.txt, { color, fontSize: small ? 11 : 13 }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', position: 'relative' },
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.ink,
  },
  body: {
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txt: {
    fontFamily: theme.font.bodyHeavy,
    letterSpacing: 0.5,
  },
});
