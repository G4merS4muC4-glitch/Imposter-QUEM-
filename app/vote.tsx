import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { Topbar } from '@/components/Topbar';
import { theme, useColors } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { colorFor } from '@/lib/colors';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';
import { useToast } from '@/lib/toast';

export default function VoteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const players = useGameStore((s) => s.players);
  const round = useGameStore((s) => s.round);
  const setAccused = useGameStore((s) => s.setAccused);
  const applyVoteScore = useGameStore((s) => s.applyVoteScore);
  const showToast = useToast((s) => s.show);

  const [selected, setSelected] = useState<number[]>([]);
  const [quitOpen, setQuitOpen] = useState(false);

  const targetCount = round.impostors.length + round.doubleAgents.length;
  const ready = selected.length === targetCount;

  const toggle = useCallback(
    (idx: number) => {
      setSelected((prev) => {
        if (prev.includes(idx)) {
          haptic.tap();
          playSound('ui');
          return prev.filter((i) => i !== idx);
        }
        if (prev.length >= targetCount) {
          // já bateu o limite — substitui o último
          haptic.warning();
          playSound('pop');
          return [...prev.slice(1), idx];
        }
        haptic.medium();
        playSound('pop');
        return [...prev, idx];
      });
    },
    [targetCount],
  );

  const confirmVote = () => {
    if (!ready) return;
    setAccused(selected);
    applyVoteScore();
    playSound('whoosh');
    haptic.heavy();
    router.replace('/reveal');
  };

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

      <Text style={[styles.title, { color: colors.ink }]}>VOTAÇÃO</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Quem o grupo acha que é o impostor?
      </Text>

      <View style={styles.counter}>
        <Text style={styles.counterTxt}>
          {selected.length} de {targetCount} selecionado
          {targetCount > 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {players.map((p, i) => {
            const c = colorFor(i);
            const picked = selected.includes(i);
            return (
              <Pressable
                key={`vote-${i}`}
                onPress={() => toggle(i)}
                style={{ width: '48%' }}
              >
                <MotiView
                  animate={{
                    scale: picked ? 1.04 : 1,
                    rotate: picked ? '-2deg' : '0deg',
                  }}
                  transition={{ type: 'spring', damping: 11 }}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: c.bg,
                      borderColor: theme.colors.ink,
                    },
                    picked ? styles.cellPicked : null,
                  ]}
                >
                  <Text style={[styles.cellNum, { color: c.text }]}>
                    {i + 1}
                  </Text>
                  <Text style={[styles.cellName, { color: c.text }]}>
                    {p.name}
                  </Text>
                  {picked ? (
                    <View style={styles.pickedBadge}>
                      <Text style={styles.pickedBadgeTxt}>✕</Text>
                    </View>
                  ) : null}
                </MotiView>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Button
        label={ready ? '🚨 CONFIRMAR VOTO' : `Selecione ${targetCount - selected.length} mais`}
        variant={ready ? 'danger' : 'ghost'}
        disabled={!ready}
        onPress={confirmVote}
      />

      <Sheet
        visible={quitOpen}
        onClose={() => setQuitOpen(false)}
        title="Cancelar votação?"
      >
        <Text style={styles.modalP}>
          A rodada continua. Você volta pra discussão.
        </Text>
        <View style={styles.modalRow}>
          <Button
            label="Continuar votando"
            variant="ghost"
            onPress={() => setQuitOpen(false)}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label="Voltar"
            variant="danger"
            onPress={() => {
              setQuitOpen(false);
              router.replace('/round');
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
    marginVertical: 4,
    color: theme.colors.ink,
  },
  subtitle: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    textAlign: 'center',
    color: '#444',
    marginBottom: 8,
  },
  counter: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.accent,
    marginBottom: 14,
  },
  counterTxt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 12,
    color: theme.colors.ink,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  cell: {
    borderWidth: 2.5,
    borderRadius: 16,
    minHeight: 88,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellPicked: {
    borderColor: theme.colors.danger,
    borderWidth: 3,
  },
  cellNum: {
    fontFamily: theme.font.display,
    fontSize: 28,
    letterSpacing: 1,
  },
  cellName: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  pickedBadge: {
    position: 'absolute',
    top: -8,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.danger,
    borderWidth: 2.5,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedBadgeTxt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 14,
    color: theme.colors.white,
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
