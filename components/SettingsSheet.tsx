import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Sheet } from './Sheet';
import { Toggle } from './Toggle';
import { PillGroup } from './PillGroup';
import { Button } from './Button';
import { theme, useColors } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsSheet({ visible, onClose }: Props) {
  const c = useColors();
  const musicOn = useGameStore((s) => s.musicOn);
  const soundPack = useGameStore((s) => s.soundPack);
  const mode = useGameStore((s) => s.mode);

  const setMusicOn = useGameStore((s) => s.setMusicOn);
  const setSoundPack = useGameStore((s) => s.setSoundPack);
  const setMode = useGameStore((s) => s.setMode);

  const reviewOnboarding = () => {
    haptic.tap();
    playSound('ui');
    useGameStore.setState({ hasSeenOnboarding: false });
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="⚙ Configurações">
      <ScrollView style={{ maxHeight: 540 }} showsVerticalScrollIndicator={false}>
        {/* Modo (geral) */}
        <View style={styles.block}>
          <View style={styles.head}>
            <Text style={[styles.title, { color: c.ink }]}>🎮 Modo geral</Text>
          </View>
          <PillGroup
            options={[
              { id: 'classic', label: 'Clássico' },
              { id: 'silent', label: 'Silencioso' },
            ]}
            value={mode}
            onChange={(v) => setMode(v as 'classic' | 'silent')}
          />
          <Text style={[styles.hint, { color: c.textMuted }]}>
            Silencioso desativa sons, música e vibração.
          </Text>
        </View>

        {/* Música */}
        <View style={styles.block}>
          <View style={styles.head}>
            <Text style={[styles.title, { color: c.ink }]}>🎵 Música de fundo</Text>
            <View style={{ flex: 1 }} />
            <Toggle on={musicOn} onChange={setMusicOn} />
          </View>
          <Text style={[styles.hint, { color: c.textMuted }]}>
            Loop ambiente que muda entre as telas (silenciado em modo silencioso).
          </Text>
        </View>

        {/* Pacote de sons */}
        <View style={styles.block}>
          <View style={styles.head}>
            <Text style={[styles.title, { color: c.ink }]}>🎚️ Pacote de sons</Text>
          </View>
          <PillGroup
            options={[
              { id: 'classic', label: 'Clássico' },
              { id: 'retro', label: 'Retrô' },
              { id: 'cinema', label: 'Cinema' },
              { id: 'cyber', label: 'Cyber' },
            ]}
            value={soundPack}
            onChange={(v) =>
              setSoundPack(v as 'classic' | 'retro' | 'cinema' | 'cyber')
            }
          />
          <Text style={[styles.hint, { color: c.textMuted }]}>
            {soundPack === 'retro'
              ? '8-bit, square waves estilo NES.'
              : soundPack === 'cinema'
                ? 'Orquestral dramático, attacks longos.'
                : soundPack === 'cyber'
                  ? 'Synthwave anos 80, saws detuned.'
                  : 'Som polido padrão.'}
          </Text>
        </View>

        {/* Tutorial */}
        <View style={[styles.block, { marginBottom: 4 }]}>
          <Button
            label="🎓 Rever apresentação"
            variant="ghost"
            size="sm"
            onPress={reviewOnboarding}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 16 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: theme.font.display,
    fontSize: 20,
    letterSpacing: 1,
  },
  hint: {
    fontFamily: theme.font.bodyMid,
    fontSize: 12,
    marginTop: 6,
  },
});
