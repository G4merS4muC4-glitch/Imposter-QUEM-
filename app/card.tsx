import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { setTrack } from '@/lib/music';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { Topbar } from '@/components/Topbar';
import { HoldCard } from '@/components/HoldCard';
import { theme, useColors } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { colorFor } from '@/lib/colors';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';

export default function CardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const players = useGameStore((s) => s.players);
  const round = useGameStore((s) => s.round);
  const difficulty = useGameStore((s) => s.difficulty);
  const spyMode = useGameStore((s) => s.spyMode);
  const nextPlayer = useGameStore((s) => s.nextPlayer);
  const prevPlayer = useGameStore((s) => s.prevPlayer);
  const setRevealed = useGameStore((s) => s.setRevealed);

  const [quitOpen, setQuitOpen] = useState(false);
  const [revealConfirm, setRevealConfirm] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setTrack(null); // silêncio no momento do reveal
    }, []),
  );

  if (!round.word || !round.category) {
    return (
      <View style={[styles.bg, { backgroundColor: colors.bg, paddingTop: insets.top + 18 }]}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>
          Sem rodada ativa.
        </Text>
        <Button label="Voltar" variant="dark" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const i = round.currentPlayer;
  const p = players[i]!;
  const c = colorFor(i);
  const isImp = round.impostors.includes(i);
  const isDoubleAgent = round.doubleAgents.includes(i);
  const cat = round.category;
  const word = round.word;
  const isLast = i === players.length - 1;

  let hintLine = '';
  if (!isImp) {
    if (difficulty === 'easy') hintLine = `Dica: ${word.hint}`;
    else hintLine = cat.name;
  } else {
    if (difficulty === 'easy') hintLine = `Categoria: ${cat.name} ${cat.emoji}`;
    else if (difficulty === 'normal') hintLine = `Dica: ${word.hint}`;
    else hintLine = 'Sem dicas. Boa sorte!';
  }

  // Modo Spy: lista os outros impostores pro impostor atual
  const otherImpostors =
    spyMode && isImp && round.impostors.length > 1
      ? round.impostors
          .filter((idx) => idx !== i)
          .map((idx) => players[idx]?.name)
          .filter(Boolean)
      : [];

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

      <View style={styles.dots}>
        {players.map((_, k) => {
          const cc = colorFor(k);
          const done = k < i;
          const cur = k === i;
          return (
            <MotiView
              key={k}
              animate={{
                scale: cur ? 1.4 : 1,
                opacity: done ? 0.55 : 1,
              }}
              transition={{ type: 'timing', duration: 250 }}
              style={[styles.dot, { backgroundColor: cc.bg }]}
            />
          );
        })}
      </View>

      <MotiView
        key={`banner-${i}`}
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 13 }}
        style={styles.bannerWrap}
      >
        <View style={styles.bannerShadow} />
        <View style={[styles.banner, { backgroundColor: c.bg }]}>
          <Text style={[styles.bannerTxt, { color: c.text }]}>
            {p.name.toUpperCase()}
          </Text>
        </View>
      </MotiView>

      <Text style={[styles.subInstr, { color: colors.textMuted }]}>
        Não mostre sua tela para os outros
      </Text>

      <HoldCard
        cardBg={c.bg}
        cardText={c.text}
        revealed={round.revealed}
        onReveal={() => setRevealed(true)}
        onUnreveal={() => setRevealed(false)}
        back={null}
        front={
          isDoubleAgent ? (
            <View style={{ alignItems: 'center' }}>
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                <Text style={{ fontSize: 54 }}>🎭</Text>
              </MotiView>
              <View style={styles.daBadge}>
                <Text style={styles.daBadgeTxt}>AGENTE DUPLO</Text>
              </View>
              <Text style={styles.wordTxt}>{word.w.toUpperCase()}</Text>
              <Text style={styles.daHint}>
                Você sabe a palavra, mas{'\n'}conta como impostor!
              </Text>
              <Text style={styles.daFoot}>
                Aja normal pra não ser acusado.
              </Text>
            </View>
          ) : isImp ? (
            <View style={{ alignItems: 'center' }}>
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                <Text style={{ fontSize: 54 }}>🕵️</Text>
              </MotiView>
              <Text style={styles.impTitle}>VOCÊ É O IMPOSTOR!</Text>
              <Text style={styles.impHint}>{hintLine}</Text>
              {otherImpostors.length > 0 ? (
                <MotiView
                  from={{ opacity: 0, translateY: 6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 320, delay: 200 }}
                  style={styles.allyBox}
                >
                  <Text style={styles.allyLabel}>SEUS ALIADOS</Text>
                  <Text style={styles.allyNames}>
                    {otherImpostors.join(' & ')}
                  </Text>
                </MotiView>
              ) : null}
              <Text style={styles.impFoot}>
                Finja que sabe! Não seja descoberto.
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                style={styles.catPill}
              >
                <Text style={styles.catPillTxt}>
                  {cat.emoji} {cat.name}
                </Text>
              </MotiView>
              <Text style={styles.wordTxt}>{word.w.toUpperCase()}</Text>
              <Text style={styles.wordHint}>{hintLine}</Text>
              <Text style={styles.wordFoot}>Não diga a palavra.</Text>
            </View>
          )
        }
      />

      <View style={styles.navRow}>
        <Pressable
          onPress={() => {
            prevPlayer();
            haptic.tap();
            playSound('ui');
          }}
          disabled={i === 0}
          style={[styles.iconBtn, i === 0 ? { opacity: 0.35 } : null]}
        >
          <Text style={styles.iconTxt}>◀</Text>
        </Pressable>
        <Button
          label={isLast ? 'Começar Rodada ▶' : 'Próximo Jogador ▶'}
          variant={isLast ? 'dark' : 'primary'}
          style={{ flex: 1 }}
          onPress={() => {
            if (isLast) {
              playSound('whoosh');
              router.replace('/round');
              return;
            }
            nextPlayer();
            haptic.tap();
            playSound('whoosh');
          }}
        />
      </View>
      <View style={{ height: 10 }} />
      <Button
        label="🚨 Revelar Impostor"
        variant="danger"
        onPress={() => setRevealConfirm(true)}
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
        title="Revelar o impostor?"
      >
        <Text style={styles.modalP}>
          A rodada será encerrada e a palavra exibida.
        </Text>
        <View style={styles.modalRow}>
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => setRevealConfirm(false)}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label="Revelar"
            variant="danger"
            onPress={() => {
              setRevealConfirm(false);
              router.replace('/reveal');
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.ink,
  },
  bannerWrap: { alignSelf: 'center', position: 'relative', marginBottom: 8 },
  bannerShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.ink,
    borderRadius: 14,
  },
  banner: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: theme.colors.ink,
  },
  bannerTxt: {
    fontFamily: theme.font.display,
    fontSize: 24,
    letterSpacing: 2,
  },
  subInstr: {
    textAlign: 'center',
    color: '#444',
    fontFamily: theme.font.bodyMid,
    fontSize: 13,
    marginBottom: 14,
  },

  catPill: {
    backgroundColor: theme.colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.ink,
  },
  catPillTxt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    color: theme.colors.white,
  },
  wordTxt: {
    fontFamily: theme.font.display,
    fontSize: 42,
    letterSpacing: 1.5,
    color: theme.colors.ink,
    marginVertical: 8,
    textAlign: 'center',
  },
  wordHint: {
    color: '#666',
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    textAlign: 'center',
  },
  wordFoot: {
    fontSize: 11,
    color: '#888',
    fontFamily: theme.font.bodyHeavy,
    marginTop: 12,
  },

  impTitle: {
    fontFamily: theme.font.display,
    fontSize: 28,
    color: theme.colors.danger,
    letterSpacing: 2,
    marginTop: 8,
    textAlign: 'center',
  },
  impHint: {
    color: '#444',
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  impFoot: {
    color: '#444',
    fontFamily: theme.font.bodyHeavy,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  allyBox: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: theme.colors.ink,
    borderRadius: 12,
    alignItems: 'center',
  },
  allyLabel: {
    color: theme.colors.accent,
    fontFamily: theme.font.bodyHeavy,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  allyNames: {
    color: theme.colors.white,
    fontFamily: theme.font.display,
    fontSize: 20,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  daBadge: {
    backgroundColor: theme.colors.warning,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  daBadgeTxt: {
    fontFamily: theme.font.display,
    fontSize: 18,
    letterSpacing: 2,
    color: theme.colors.ink,
  },
  daHint: {
    color: '#444',
    fontFamily: theme.font.bodyHeavy,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  daFoot: {
    color: '#888',
    fontFamily: theme.font.bodyHeavy,
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTxt: { fontFamily: theme.font.bodyHeavy, fontSize: 18 },

  modalP: {
    fontFamily: theme.font.body,
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalRow: { flexDirection: 'row', marginTop: 14 },
});
