import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useRouter, useFocusEffect } from 'expo-router';
import { setTrack } from '@/lib/music';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { Topbar } from '@/components/Topbar';
import { Confetti } from '@/components/Confetti';
import { StatsSheet } from '@/components/StatsSheet';
import { theme, useColors } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { colorFor, IMP_EMOJIS } from '@/lib/colors';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';
import { useToast } from '@/lib/toast';

export default function RevealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const players = useGameStore((s) => s.players);
  const round = useGameStore((s) => s.round);
  const scores = useGameStore((s) => s.scores);
  const difficulty = useGameStore((s) => s.difficulty);
  const voteMode = useGameStore((s) => s.voteMode);
  const applyScore = useGameStore((s) => s.applyScore);
  const resetScores = useGameStore((s) => s.resetScores);
  const startRound = useGameStore((s) => s.startRound);
  const showToast = useToast((s) => s.show);

  // No modo voto, o score já foi aplicado em /vote — não abre o modal manual
  const cameFromVote = voteMode && round.accused.length > 0;
  const [askOpen, setAskOpen] = useState(!cameFromVote);
  const [resetOpen, setResetOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [confetti, setConfetti] = useState(true);
  const captureViewRef = useRef<View>(null);

  useFocusEffect(
    React.useCallback(() => {
      setTrack(null); // silêncio pra deixar o impostor sound + confetti serem o momento
    }, []),
  );

  useEffect(() => {
    playSound('impostor');
    haptic.heavy();
    // sparkly cascade as confetti rains
    const sparkle = setTimeout(() => playSound('confetti'), 400);
    const t = setTimeout(() => setConfetti(false), 4500);
    return () => {
      clearTimeout(t);
      clearTimeout(sparkle);
    };
  }, []);

  const impEmoji = useMemo(
    () => IMP_EMOJIS[Math.floor(Math.random() * IMP_EMOJIS.length)],
    [],
  );

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

  const impNames = round.impostors.map((i) => players[i]!.name);
  const doubleAgentNames = round.doubleAgents.map((i) => players[i]!.name);
  const accusedNames = round.accused.map((i) => players[i]!.name);
  const targetsSet = new Set([...round.impostors, ...round.doubleAgents]);
  const groupWon =
    cameFromVote &&
    round.accused.length === targetsSet.size &&
    round.accused.every((idx) => targetsSet.has(idx));
  const hintLine =
    difficulty === 'hard' ? round.word.hintHard : round.word.hint;

  const sortedScores = [...players]
    .map((p, i) => ({ name: p.name, idx: i, pts: scores[p.name] ?? 0 }))
    .sort((a, b) => b.pts - a.pts);

  const onNewRound = () => {
    const ok = startRound();
    if (ok) {
      haptic.tap();
      playSound('click');
      router.replace('/card');
    } else {
      showToast('Configuração inválida', 'error');
    }
  };

  const onShare = async () => {
    haptic.tap();
    playSound('ui');
    try {
      const node = captureViewRef.current;
      if (!node) return;
      const uri = await captureRef(node, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartilhar resultado',
        });
      } else {
        // fallback pro Share nativo do RN com texto + URL
        const summary = `🕵️ Impostor Quem? — A palavra era ${round.word?.w}. Impostor: ${impNames.join(', ')}.`;
        await Share.share({ message: summary, url: uri });
      }
    } catch (e) {
      showToast('Não foi possível compartilhar', 'error');
    }
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
      <Topbar
        onLeft={() => router.replace('/')}
        leftIcon="⌂"
        leftVariant="accent"
      />

      <Confetti active={confetti} />

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View
          ref={captureViewRef}
          collapsable={false}
          style={[styles.captureArea, { backgroundColor: colors.bg }]}
        >
        <Text style={[styles.title, { color: colors.ink }]}>🚨 REVELAÇÃO!</Text>

        <MotiView
          from={{ scale: 0, rotate: '6deg', opacity: 0 }}
          animate={{ scale: 1, rotate: '0deg', opacity: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          <View style={styles.revealShadow} />
          <View style={styles.revealCard}>
            <Text style={styles.revealEmoji}>{impEmoji}</Text>
            <Text style={styles.revealLbl}>
              {impNames.length > 1 ? 'Impostores eram' : 'O impostor era'}
            </Text>
            <Text style={styles.revealNames}>
              {impNames.join(' & ').toUpperCase()}
            </Text>
            {doubleAgentNames.length > 0 ? (
              <View style={styles.daRevealBox}>
                <Text style={styles.daRevealLbl}>🎭 Agente Duplo</Text>
                <Text style={styles.daRevealName}>
                  {doubleAgentNames.join(' & ').toUpperCase()}
                </Text>
              </View>
            ) : null}
            <Text style={styles.wordLbl}>A palavra era</Text>
            <Text style={styles.revealWord}>{round.word.w.toUpperCase()}</Text>
            <Text style={styles.revealMeta}>
              {round.category.emoji} {round.category.name} • {hintLine}
            </Text>
          </View>
        </MotiView>

        {cameFromVote ? (
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 320, delay: 400 }}
            style={[
              styles.voteResult,
              groupWon ? styles.voteWon : styles.voteLost,
            ]}
          >
            <Text style={styles.voteResultLbl}>
              {groupWon ? '🎯 GRUPO ACERTOU!' : '🎭 IMPOSTOR ESCAPOU!'}
            </Text>
            <Text style={styles.voteResultDetail}>
              Votado: {accusedNames.join(' & ')}
            </Text>
          </MotiView>
        ) : null}

        <View
          style={[
            styles.scoreboard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.scoreHead}>
            <Text style={[styles.scoreTitle, { color: colors.ink }]}>
              🏆 PLACAR
            </Text>
            <View style={{ flex: 1 }} />
            <Button
              label="📊 Stats"
              variant="dark"
              size="sm"
              onPress={() => setStatsOpen(true)}
              style={{ marginRight: 6 }}
            />
            <Button
              label="Zerar"
              variant="ghost"
              size="sm"
              onPress={() => setResetOpen(true)}
            />
          </View>
          {sortedScores.map((row, rank) => {
            const c = colorFor(row.idx);
            const medal =
              rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : ' ';
            const isLeader = rank === 0 && row.pts > 0;
            return (
              <MotiView
                key={`${row.idx}-${row.name}`}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: 220,
                  delay: rank * 60,
                }}
                style={[
                  styles.scoreRow,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
              >
                {isLeader ? (
                  <MotiView
                    from={{ translateY: 0, rotate: '-12deg' }}
                    animate={{ translateY: -4, rotate: '8deg' }}
                    transition={{
                      type: 'timing',
                      duration: 700,
                      loop: true,
                    }}
                    style={styles.crown}
                  >
                    <Text style={styles.crownTxt}>👑</Text>
                  </MotiView>
                ) : null}
                <Text style={styles.medal}>{medal}</Text>
                <View
                  style={[
                    styles.scoreChip,
                    { backgroundColor: c.bg },
                  ]}
                >
                  <Text style={[styles.scoreChipTxt, { color: c.text }]}>
                    {row.idx + 1}
                  </Text>
                </View>
                <Text style={[styles.scoreName, { color: colors.ink }]}>
                  {row.name}
                </Text>
                <View style={styles.scorePtsWrap}>
                  <View style={styles.scorePtsShadow} />
                  <View
                    style={[
                      styles.scorePts,
                      isLeader
                        ? { backgroundColor: theme.colors.warning }
                        : null,
                    ]}
                  >
                    <Text style={styles.scorePtsTxt}>{row.pts}</Text>
                  </View>
                </View>
              </MotiView>
            );
          })}
        </View>
        </View>{/* /captureArea */}

        <Button
          label="📤 Compartilhar Resultado"
          variant="dark"
          onPress={onShare}
        />
        <View style={{ height: 10 }} />
        <Button label="🔁 Nova Rodada" variant="primary" onPress={onNewRound} />
        <View style={{ height: 10 }} />
        <Button
          label="⚙ Configurações"
          variant="ghost"
          onPress={() => router.replace('/setup')}
        />
      </ScrollView>

      <Sheet
        visible={askOpen}
        onClose={() => setAskOpen(false)}
        title="O grupo acertou?"
      >
        <Text style={styles.modalP}>
          Vocês descobriram quem era o impostor antes da revelação?
        </Text>
        <View style={styles.modalRow}>
          <Button
            label="Não 😅"
            variant="danger"
            onPress={() => {
              applyScore(false);
              setAskOpen(false);
              showToast('Impostor levou os pontos!', 'warning');
              haptic.warning();
              playSound('wrong');
            }}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label="Sim! 🎯"
            variant="primary"
            onPress={() => {
              applyScore(true);
              setAskOpen(false);
              showToast('Pontos para o grupo!', 'success');
              haptic.success();
              playSound('correct');
            }}
            style={{ flex: 1 }}
          />
        </View>
      </Sheet>

      <StatsSheet visible={statsOpen} onClose={() => setStatsOpen(false)} />

      <Sheet
        visible={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Zerar placar?"
      >
        <Text style={styles.modalP}>
          Todas as pontuações da sessão serão apagadas.
        </Text>
        <View style={styles.modalRow}>
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => setResetOpen(false)}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label="Zerar"
            variant="danger"
            onPress={() => {
              resetScores();
              setResetOpen(false);
              showToast('Placar zerado', 'success');
              haptic.tap();
              playSound('coin');
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
    fontSize: 42,
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: 8,
    color: theme.colors.ink,
  },
  revealShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 0,
    bottom: 12,
    backgroundColor: theme.colors.ink,
    borderRadius: 22,
  },
  revealCard: {
    backgroundColor: theme.colors.white,
    borderWidth: 3,
    borderColor: theme.colors.ink,
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    marginBottom: 18,
  },
  revealEmoji: { fontSize: 64 },
  revealLbl: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 11,
    color: '#666',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  revealNames: {
    fontFamily: theme.font.display,
    fontSize: 30,
    letterSpacing: 2,
    color: theme.colors.ink,
    marginVertical: 6,
    textAlign: 'center',
  },
  wordLbl: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 11,
    color: '#666',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  revealWord: {
    fontFamily: theme.font.display,
    fontSize: 38,
    letterSpacing: 1.5,
    color: theme.colors.accentShadow,
  },
  revealMeta: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    color: '#444',
    marginTop: 6,
    textAlign: 'center',
  },
  daRevealBox: {
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: theme.colors.warning,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  daRevealLbl: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 11,
    letterSpacing: 1.5,
    color: theme.colors.ink,
  },
  daRevealName: {
    fontFamily: theme.font.display,
    fontSize: 22,
    letterSpacing: 1.5,
    color: theme.colors.ink,
  },
  voteResult: {
    borderWidth: 2.5,
    borderColor: theme.colors.ink,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  voteWon: {
    backgroundColor: theme.colors.success,
  },
  voteLost: {
    backgroundColor: theme.colors.danger,
  },
  voteResultLbl: {
    fontFamily: theme.font.display,
    fontSize: 22,
    letterSpacing: 1.5,
    color: theme.colors.white,
  },
  voteResultDetail: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    color: theme.colors.white,
    marginTop: 4,
  },
  captureArea: {
    backgroundColor: theme.colors.bg,
    paddingVertical: 4,
  },

  scoreboard: {
    backgroundColor: theme.colors.white,
    borderWidth: 2.5,
    borderColor: theme.colors.ink,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  scoreHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  scoreTitle: {
    fontFamily: theme.font.display,
    fontSize: 22,
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.grayLight,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  medal: { fontSize: 20, width: 26, textAlign: 'center' },
  crown: {
    position: 'absolute',
    top: -16,
    left: 0,
    zIndex: 10,
  },
  crownTxt: { fontSize: 22 },
  scoreChip: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreChipTxt: { fontFamily: theme.font.bodyHeavy, fontSize: 11 },
  scoreName: {
    flex: 1,
    fontFamily: theme.font.bodyHeavy,
    fontSize: 14,
    color: theme.colors.ink,
  },
  scorePtsWrap: { position: 'relative' },
  scorePtsShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.ink,
    borderRadius: 8,
  },
  scorePts: {
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  scorePtsTxt: {
    fontFamily: theme.font.display,
    fontSize: 22,
    letterSpacing: 1,
    color: theme.colors.ink,
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
