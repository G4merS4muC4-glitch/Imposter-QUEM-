import React from 'react';
import { StyleSheet, View, Text, type ViewStyle } from 'react-native';
import { theme, useColors } from '@/lib/theme';

type Props = {
  title?: string;
  emoji?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function Section({ title, emoji, children, right, style }: Props) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <View style={[styles.shadow, { backgroundColor: c.shadow }]} />
      <View
        style={[
          styles.card,
          { backgroundColor: c.surface, borderColor: c.border },
          style,
        ]}
      >
        {title ? (
          <View style={styles.head}>
            <Text style={[styles.title, { color: c.ink }]}>
              {emoji ? `${emoji}  ` : ''}
              {title}
            </Text>
            {right ? <View style={{ marginLeft: 'auto' }}>{right}</View> : null}
          </View>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', marginBottom: 14 },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  card: {
    borderWidth: 2.5,
    borderRadius: 20,
    padding: 14,
  },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: {
    fontFamily: theme.font.display,
    fontSize: 22,
    letterSpacing: 1,
  },
});
