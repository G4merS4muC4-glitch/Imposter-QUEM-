import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { setTrack } from '@/lib/music';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { Topbar } from '@/components/Topbar';
import { TimerRing } from '@/components/TimerRing';
import { theme, useColors } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { colorFor } from '@/lib/colors';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';
import { useToast } from '@/lib/toast';

export default function RoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const players = useGameStore((s) => s.players);
  const round = useGameStore((s) => s.round);
  const timerOn = useGameStore((s) => s.timerOn);
  const timerMinutes = useGameStore((s) => s.timerMinutes);
  const voteMode = useGameStore((s) => s.voteMode);
  const showToast = useToast((s) => s.show);

  const total = timerMinutes * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(timerOn);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [quitOpen, setQuitOpen] = useState(false);
  const [revealConfirm, setRevealConfirm] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setTrack('tense');
    }, []),
  );

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          playSound('alarm');
          haptic.warning();
          showToast('⏰ Tempo esgotado!', 'warning');
          return 0;
        }
        // tick nos últimos 5 segundos
        if (r <= 6 && r > 1) {
          playSound('tick');
          haptic.tap();
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, showToast]);

  const reset = () => {
    setRemaining(total);
    setRunning(timerOn);
    haptic.tap();
    playSound('ui');
  };

  if (!round.word || !round.category) {
    return (
      <View style={[styles.bg, { backgroundColor: colors.bg, paddingTop: insets.top + 18 }]}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>
          Sem rodada ativa.
        </Text>
        <Button
          label="Voltar"
          variant="dark"
          onPress={() => router.replace('/')}
        />
      </View>
    );
  }

  const starter = players[round.starterIndex]!;
  const sc = colorFor(round.starterIndex);

  return (
    <View
      style={[
        styles.bg,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <Topbar onLeft={() => setQuitOpen(true)} leftIcon="✕" leftDanger />

      <Text style={[styles.title, { color: colors.ink }]}>DISCUSSÃO!</Text>

      <MotiView
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        style={[
          styles.starterCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.starterLabel, { color: colors.textMuted }]}>
          QUEM COMEÇA
        </Text>
        <View style={[styles.starterPill, { backgroundColor: sc.bg }]}>
          <Text style={[styles.starterName, { color: sc.text }]}>
            {starter.name.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.starterHint}>
          Descreva a palavra sem dizê-la. O impostor finge que sabe.
        </Text>
      </MotiView>

      {timerOn ? (
        <View style={{ alignItems: 'center' }}>
          <TimerRing totalSeconds={total} remaining={remaining} />
          <View style={styles.timerCtrls}>
            <Button
              label={running ? '⏸ Pausar' : '▶ Retomar'}
              variant="dark"
              size="sm"
              onPress={() => setRunning((r) => !r)}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              label="🔄 Resetar"
              variant="ghost"
              size="sm"
              onPress={reset}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : null}

      <Button
        label={voteMode ? '🗳️ Ir para Votação' : '🚨 Revelar Impostor'}
        variant="danger"
        onPress={() => setRevealConfirm(true)}
      />
      <View style={{ height: 10 }} />
      <Button
        label="⚙ Configurações"
        variant="ghost"
        onPress={() => router.replace('/setup')}
      />

      <Sheet
        visible={quitOpen}
        onClose={() => setQuitOpen(false)}
        title="Sair do jogo?"
      >
        <Text style={styles.modalP}>
          O progresso atual será perdido. O placar permanece.
        </Text>
        <View style={styles.modalRow}>
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => setQuitOpen(false)}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label="Sair"
            variant="danger"
            onPress={() => {
              setQuitOpen(false);
              router.replace('/');
            }}
            style={{ flex: 1 }}
          />
        </View>
      </Sheet>

      <Sheet
        visible={revealConfirm}
        onClose={() => setRevealConfirm(false)}
        title={voteMode ? 'Ir para a votação?' : 'Revelar o impostor?'}
      >
        <Text style={styles.modalP}>
          {voteMode
            ? 'O grupo vai escolher quem é o impostor no app.'
            : 'A rodada será encerrada e a palavra exibida.'}
        </Text>
        <View style={styles.modalRow}>
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => setRevealConfirm(false)}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label={voteMode ? 'Votar' : 'Revelar'}
            variant="danger"
            onPress={() => {
              setRevealConfirm(false);
              router.replace(voteMode ? '/vote' : '/reveal');
            }}
            style={{ flex: 1 }}
          />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 18 },
  title: {
    fontFamily: theme.font.display,
    fontSize: 40,
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: 8,
    color: theme.colors.ink,
  },
  starterCard: {
    backgroundColor: theme.colors.white,
    borderWidth: 2.5,
    borderColor: theme.colors.ink,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  starterLabel: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 11,
    color: '#666',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  starterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    marginVertical: 8,
  },
  starterName: {
    fontFamily: theme.font.display,
    fontSize: 24,
    letterSpacing: 1.5,
  },
  starterHint: {
    fontFamily: theme.font.bodyMid,
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
  },
  timerCtrls: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 14,
    paddingHorizontal: 0,
  },
  modalP: {
    fontFamily: theme.font.body,
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalRow: { flexDirection: 'row', marginTop: 14 },
});
