import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { LogoAnimated } from '@/components/LogoAnimated';
import { SettingsSheet } from '@/components/SettingsSheet';
import { theme, useColors } from '@/lib/theme';
import { useFocusEffect } from 'expo-router';
import { setTrack } from '@/lib/music';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const blobOpacity = 0.4;
  const [howOpen, setHowOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setTrack('ambient');
    }, []),
  );

  return (
    <View
      style={[
        styles.bg,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {/* Botão de configurações no canto superior direito */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 14,
          right: 18,
          zIndex: 5,
        }}
        pointerEvents="box-none"
      >
        <View style={styles.gearWrap}>
          <View style={styles.gearShadow} />
          <Pressable
            onPress={() => {
              haptic.tap();
              playSound('ui');
              setSettingsOpen(true);
            }}
            style={[
              styles.gearBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.gearTxt, { color: colors.ink }]}>⚙</Text>
          </Pressable>
        </View>
      </View>

      {/* Animated gradient blobs — slowly drift + change hue */}
      <MotiView
        from={{ translateX: -60, translateY: -40, scale: 1 }}
        animate={{ translateX: 60, translateY: 40, scale: 1.15 }}
        transition={{
          type: 'timing',
          duration: 8000,
          loop: true,
          repeatReverse: true,
        }}
        style={[styles.blob, styles.blobA, { opacity: blobOpacity }]}
      />
      <MotiView
        from={{ translateX: 50, translateY: -20, scale: 1.1 }}
        animate={{ translateX: -50, translateY: 30, scale: 0.95 }}
        transition={{
          type: 'timing',
          duration: 11000,
          loop: true,
          repeatReverse: true,
        }}
        style={[styles.blob, styles.blobB, { opacity: blobOpacity }]}
      />
      <MotiView
        from={{ translateX: 0, translateY: 60, scale: 0.9 }}
        animate={{ translateX: 30, translateY: -60, scale: 1.05 }}
        transition={{
          type: 'timing',
          duration: 14000,
          loop: true,
          repeatReverse: true,
        }}
        style={[styles.blob, styles.blobC, { opacity: blobOpacity }]}
      />
      <View style={styles.deco1} />
      <View style={styles.deco2} />

      <View style={styles.center}>
        <LogoAnimated />

        <MotiView
          from={{ translateY: 20, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'timing', duration: 300, delay: 400 }}
          style={styles.taglineWrap}
        >
          <View style={styles.taglineShadow} />
          <View style={styles.tagline}>
            <Text style={styles.taglineTxt}>
              O jogo de farejadores e mentirosos
            </Text>
          </View>
        </MotiView>
      </View>

      <View style={styles.actions}>
        <Button
          label="▶ Jogar"
          variant="primary"
          pulse
          onPress={() => router.push('/setup')}
        />
        <View style={{ height: 12 }} />
        <Button
          label="Como Jogar"
          variant="ghost"
          onPress={() => setHowOpen(true)}
        />
      </View>

      <View style={styles.credit}>
        <Text style={styles.creditLine1}>feito por</Text>
        <Text style={styles.creditHandle}>📷 @samukafilmaker</Text>
      </View>
      <Text style={[styles.version, { color: colors.textMuted }]}>v1.0</Text>

      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <Sheet
        visible={howOpen}
        onClose={() => setHowOpen(false)}
        title="Como Jogar"
      >
        <ScrollView style={{ maxHeight: 420 }}>
          <HowStep emoji="📝" text="Configure jogadores e categorias." />
          <HowStep emoji="📱" text="Passe o celular para cada jogador." />
          <HowStep emoji="👆" text="Segure o card para ver sua palavra." />
          <HowStep emoji="🗣️" text="Discuta! Descreva sem falar a palavra." />
          <HowStep emoji="🕵️" text="Acuse quem você acha que é o impostor." />
          <HowStep emoji="🚨" text="Revele e veja se o grupo acertou!" />
        </ScrollView>
        <View style={{ height: 14 }} />
        <Button
          label="Entendi!"
          variant="primary"
          onPress={() => setHowOpen(false)}
        />
      </Sheet>
    </View>
  );
}

function HowStep({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>{emoji}</Text>
      <Text style={styles.stepTxt}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 18,
  },
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 999,
    opacity: 0.35,
  },
  gearWrap: { position: 'relative', width: 44, height: 44 },
  gearShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.ink,
    borderRadius: 14,
  },
  gearBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearTxt: {
    fontSize: 22,
    lineHeight: 24,
  },
  blobA: {
    top: -120,
    left: -80,
    backgroundColor: '#AAEE00', // accent
  },
  blobB: {
    top: 200,
    right: -100,
    backgroundColor: '#FFD600', // amarelo
  },
  blobC: {
    bottom: -60,
    left: 40,
    backgroundColor: '#4FC3F7', // azul
  },
  deco1: {
    position: 'absolute',
    top: -180,
    left: -160,
    width: 520,
    height: 520,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(26,26,26,0.08)',
  },
  deco2: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(26,26,26,0.08)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  bigTxt: {
    fontFamily: theme.font.display,
    fontSize: 96,
    letterSpacing: 2,
    lineHeight: 96,
    color: theme.colors.ink,
  },
  taglineWrap: { marginTop: 18 },
  taglineShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.ink,
    borderRadius: 999,
  },
  tagline: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.ink,
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  taglineTxt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    color: theme.colors.ink,
  },
  actions: { width: '100%', maxWidth: 320, alignSelf: 'center', marginTop: 28 },
  version: {
    alignSelf: 'flex-end',
    fontFamily: theme.font.bodyHeavy,
    color: '#888',
    fontSize: 11,
    marginTop: 8,
  },
  credit: {
    alignItems: 'center',
    marginTop: 16,
  },
  creditLine1: {
    fontFamily: theme.font.bodyMid,
    fontSize: 11,
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  creditHandle: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 15,
    color: '#1A1A1A',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.grayLight,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  stepEmoji: { fontSize: 24, marginRight: 10 },
  stepTxt: {
    flex: 1,
    fontFamily: theme.font.body,
    fontSize: 14,
    color: theme.colors.ink,
  },
});
