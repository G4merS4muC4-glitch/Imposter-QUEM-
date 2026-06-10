import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { theme } from '@/lib/theme';

const LETTERS = ['Q', 'U', 'E', 'M', '?'];

// Sparkles distribuídos ao redor do logo (posição absoluta relativa ao container)
const SPARKLES = [
  { emoji: '✨', left: '-12%', top: '-20%', delay: 0, dur: 2200 },
  { emoji: '⭐', right: '-14%', top: '-10%', delay: 400, dur: 2600 },
  { emoji: '✨', left: '-8%', bottom: '-18%', delay: 800, dur: 2400 },
  { emoji: '⭐', right: '-10%', bottom: '-22%', delay: 1200, dur: 2800 },
  { emoji: '✨', left: '50%', top: '-32%', delay: 600, dur: 2500 },
] as const;

export function LogoAnimated() {
  return (
    <View style={styles.wrap}>
      {/* IMPOSTER plate — pop in */}
      <MotiView
        from={{ scale: 0, opacity: 0, translateY: -20 }}
        animate={{ scale: 1, opacity: 1, translateY: 0 }}
        transition={{
          type: 'spring',
          damping: 12,
          mass: 0.8,
        }}
      >
        <View style={styles.topPlate}>
          <Text style={styles.topPlateTxt}>IMPOSTER</Text>
        </View>
      </MotiView>

      {/* QUEM? main plate — continuous gentle sway */}
      <MotiView
        from={{ rotate: '-2deg' }}
        animate={{ rotate: '2deg' }}
        transition={{
          type: 'timing',
          duration: 3000,
          loop: true,
          repeatReverse: true,
        }}
        style={{ marginTop: 12 }}
      >
        <View style={styles.bigShadow} />
        <View style={styles.bigPlate}>
          {LETTERS.map((l, i) => (
            <LetterAnimated key={`l-${i}`} letter={l} index={i} />
          ))}
        </View>
      </MotiView>

      {/* Sparkles */}
      {SPARKLES.map((s, i) => (
        <MotiView
          key={`sp-${i}`}
          from={{ scale: 0, opacity: 0, rotate: '0deg' }}
          animate={{ scale: 1, opacity: 1, rotate: '360deg' }}
          transition={{
            type: 'timing',
            duration: s.dur,
            loop: true,
            repeatReverse: true,
            delay: s.delay,
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={[styles.sparkle, s as any]}
          pointerEvents="none"
        >
          <Text style={styles.sparkleTxt}>{s.emoji}</Text>
        </MotiView>
      ))}
    </View>
  );
}

function LetterAnimated({ letter, index }: { letter: string; index: number }) {
  // Cada letra: entrada com bounce + breathing contínuo dessincronizado
  return (
    <MotiView
      from={{ translateY: -100, rotate: '20deg', opacity: 0 }}
      animate={{ translateY: 0, rotate: '0deg', opacity: 1 }}
      transition={{
        type: 'spring',
        damping: 9,
        mass: 0.7,
        delay: 220 + index * 80,
      }}
    >
      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: -4 }}
        transition={{
          type: 'timing',
          duration: 1400 + index * 180,
          loop: true,
          repeatReverse: true,
          delay: 900 + index * 120,
        }}
      >
        <MotiText style={styles.bigTxt}>{letter}</MotiText>
      </MotiView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    position: 'relative',
  },
  topPlate: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.ink,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  topPlateTxt: {
    fontFamily: theme.font.display,
    fontSize: 34,
    letterSpacing: 6,
    color: theme.colors.ink,
  },
  bigShadow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.ink,
    borderRadius: 18,
  },
  bigPlate: {
    backgroundColor: theme.colors.accent,
    borderWidth: 3,
    borderColor: theme.colors.ink,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
  },
  bigTxt: {
    fontFamily: theme.font.display,
    fontSize: 92,
    letterSpacing: 2,
    lineHeight: 96,
    color: theme.colors.ink,
  },
  sparkle: {
    position: 'absolute',
    zIndex: -1,
  },
  sparkleTxt: {
    fontSize: 24,
  },
});
