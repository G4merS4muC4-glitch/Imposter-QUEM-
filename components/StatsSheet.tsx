import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { theme } from '@/lib/theme';
import { useGameStore, type PlayerStats } from '@/lib/store';
import { colorFor } from '@/lib/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Row = {
  idx: number;
  name: string;
  stats: PlayerStats;
};

export function StatsSheet({ visible, onClose }: Props) {
  const players = useGameStore((s) => s.players);
  const stats = useGameStore((s) => s.stats);
  const resetStats = useGameStore((s) => s.resetStats);
  const setHasSeenOnboarding = (v: boolean) =>
    useGameStore.setState({ hasSeenOnboarding: v });

  const rows: Row[] = useMemo(
    () =>
      players.map((p, i) => ({
        idx: i,
        name: p.name,
        stats: stats[p.name] ?? {
          roundsPlayed: 0,
          timesImpostor: 0,
          timesDoubleAgent: 0,
          timesCaught: 0,
          timesEscaped: 0,
          timesAccusedWrong: 0,
        },
      })),
    [players, stats],
  );

  const totals = useMemo(() => {
    let rounds = 0;
    let impostors = 0;
    let doubleAgents = 0;
    rows.forEach((r) => {
      rounds = Math.max(rounds, r.stats.roundsPlayed);
      impostors += r.stats.timesImpostor;
      doubleAgents += r.stats.timesDoubleAgent;
    });
    return { rounds, impostors, doubleAgents };
  }, [rows]);

  // tops
  const mostImpostor = useMemo(
    () => [...rows].sort((a, b) => b.stats.timesImpostor - a.stats.timesImpostor)[0],
    [rows],
  );
  const bestEscaper = useMemo(
    () => [...rows].sort((a, b) => b.stats.timesEscaped - a.stats.timesEscaped)[0],
    [rows],
  );
  const mostSuspect = useMemo(
    () =>
      [...rows].sort(
        (a, b) => b.stats.timesAccusedWrong - a.stats.timesAccusedWrong,
      )[0],
    [rows],
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="📊 Estatísticas">
      <View style={styles.summary}>
        <SummaryChip label="Rodadas" value={totals.rounds} />
        <SummaryChip label="🕵️ Impostor" value={totals.impostors} />
        <SummaryChip label="🎭 Agente Duplo" value={totals.doubleAgents} />
      </View>

      {totals.rounds > 0 ? (
        <View style={styles.highlights}>
          {mostImpostor && mostImpostor.stats.timesImpostor > 0 ? (
            <Highlight
              emoji="🕵️"
              label="Maior impostor"
              name={mostImpostor.name}
              detail={`${mostImpostor.stats.timesImpostor}x`}
              color={colorFor(mostImpostor.idx).bg}
            />
          ) : null}
          {bestEscaper && bestEscaper.stats.timesEscaped > 0 ? (
            <Highlight
              emoji="🦊"
              label="Melhor escapista"
              name={bestEscaper.name}
              detail={`${bestEscaper.stats.timesEscaped} fugas`}
              color={colorFor(bestEscaper.idx).bg}
            />
          ) : null}
          {mostSuspect && mostSuspect.stats.timesAccusedWrong > 0 ? (
            <Highlight
              emoji="🤨"
              label="Cara suspeita"
              name={mostSuspect.name}
              detail={`${mostSuspect.stats.timesAccusedWrong} acusações erradas`}
              color={colorFor(mostSuspect.idx).bg}
            />
          ) : null}
        </View>
      ) : null}

      <ScrollView style={{ maxHeight: 340 }}>
        {rows.map((r) => (
          <MotiView
            key={`stat-${r.idx}`}
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 180, delay: r.idx * 30 }}
            style={styles.row}
          >
            <View
              style={[
                styles.chip,
                { backgroundColor: colorFor(r.idx).bg },
              ]}
            >
              <Text
                style={[
                  styles.chipTxt,
                  { color: colorFor(r.idx).text },
                ]}
              >
                {r.idx + 1}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.name}</Text>
              <Text style={styles.detail}>
                🎮 {r.stats.roundsPlayed} • 🕵️ {r.stats.timesImpostor} •
                {' '}🎭 {r.stats.timesDoubleAgent} • 🪤 {r.stats.timesCaught} •
                {' '}🦊 {r.stats.timesEscaped}
              </Text>
            </View>
          </MotiView>
        ))}
      </ScrollView>

      {totals.rounds > 0 ? (
        <Button
          label="Zerar estatísticas"
          variant="ghost"
          size="sm"
          onPress={resetStats}
          style={{ marginTop: 14 }}
        />
      ) : (
        <Text style={styles.empty}>
          Sem rodadas jogadas ainda — joga uma partida pra ver as estatísticas.
        </Text>
      )}

      <Button
        label="🎓 Rever apresentação"
        variant="ghost"
        size="sm"
        onPress={() => {
          setHasSeenOnboarding(false);
          onClose();
        }}
        style={{ marginTop: 8 }}
      />
    </Sheet>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryChip}>
      <Text style={styles.summaryVal}>{value}</Text>
      <Text style={styles.summaryLbl}>{label}</Text>
    </View>
  );
}

function Highlight({
  emoji,
  label,
  name,
  detail,
  color,
}: {
  emoji: string;
  label: string;
  name: string;
  detail: string;
  color: string;
}) {
  return (
    <View style={[styles.highlight, { backgroundColor: color }]}>
      <Text style={styles.highlightEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.highlightLbl}>{label}</Text>
        <Text style={styles.highlightName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text style={styles.highlightDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryChip: {
    flex: 1,
    backgroundColor: theme.colors.grayLight,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  summaryVal: {
    fontFamily: theme.font.display,
    fontSize: 26,
    color: theme.colors.ink,
    letterSpacing: 1,
  },
  summaryLbl: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#666',
  },
  highlights: { gap: 8, marginBottom: 12 },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 14,
  },
  highlightEmoji: { fontSize: 26 },
  highlightLbl: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.ink,
    opacity: 0.7,
  },
  highlightName: {
    fontFamily: theme.font.display,
    fontSize: 20,
    letterSpacing: 1,
    color: theme.colors.ink,
  },
  highlightDetail: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 12,
    color: theme.colors.ink,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.ink,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.grayLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    marginBottom: 6,
  },
  chip: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTxt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
  },
  name: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 14,
    color: theme.colors.ink,
  },
  detail: {
    fontFamily: theme.font.body,
    fontSize: 11,
    color: '#555',
    marginTop: 2,
  },
  empty: {
    fontFamily: theme.font.body,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 14,
  },
});
