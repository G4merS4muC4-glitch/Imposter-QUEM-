import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setTrack } from '@/lib/music';
import { MotiView } from 'moti';
import { Button } from '@/components/Button';
import { Section } from '@/components/Section';
import { Badge } from '@/components/Badge';
import { Topbar } from '@/components/Topbar';
import { Slider } from '@/components/Slider';
import { Toggle } from '@/components/Toggle';
import { PillGroup } from '@/components/PillGroup';
import { SettingsSheet } from '@/components/SettingsSheet';
import { theme, useColors } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { CATEGORIES } from '@/lib/words';
import { colorFor } from '@/lib/colors';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';
import { useToast } from '@/lib/toast';

export default function Setup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showToast = useToast((s) => s.show);
  const colors = useColors();

  const players = useGameStore((s) => s.players);
  const impostorCount = useGameStore((s) => s.impostorCount);
  const spyMode = useGameStore((s) => s.spyMode);
  const doubleAgentMode = useGameStore((s) => s.doubleAgentMode);
  const voteMode = useGameStore((s) => s.voteMode);
  const timerOn = useGameStore((s) => s.timerOn);
  const timerMinutes = useGameStore((s) => s.timerMinutes);
  const difficulty = useGameStore((s) => s.difficulty);
  const selectedCategories = useGameStore((s) => s.selectedCategories);

  const addPlayer = useGameStore((s) => s.addPlayer);
  const removePlayer = useGameStore((s) => s.removePlayer);
  const renamePlayer = useGameStore((s) => s.renamePlayer);
  const setImpostorCount = useGameStore((s) => s.setImpostorCount);
  const setSpyMode = useGameStore((s) => s.setSpyMode);
  const setDoubleAgentMode = useGameStore((s) => s.setDoubleAgentMode);
  const setVoteMode = useGameStore((s) => s.setVoteMode);
  const setTimerOn = useGameStore((s) => s.setTimerOn);
  const setTimerMinutes = useGameStore((s) => s.setTimerMinutes);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const toggleCategory = useGameStore((s) => s.toggleCategory);
  const setAllCategories = useGameStore((s) => s.setAllCategories);
  const startRound = useGameStore((s) => s.startRound);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [newName, setNewName] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      setTrack('ambient');
    }, []),
  );

  const handleStart = () => {
    if (players.length < 3) {
      showToast('Adicione ao menos 3 jogadores', 'error');
      haptic.error();
      return;
    }
    if (selectedCategories.length === 0) {
      showToast('Selecione ao menos 1 categoria', 'error');
      haptic.error();
      return;
    }
    if (impostorCount >= players.length) {
      showToast('Impostores demais!', 'error');
      haptic.error();
      return;
    }
    const ok = startRound();
    if (ok) {
      haptic.success();
      playSound('boot');
      router.push('/card');
    }
  };

  const diffDesc = {
    easy: 'Impostor vê a categoria, mas não a palavra.',
    normal: 'Impostor recebe uma dica genérica.',
    hard: 'Impostor não recebe NENHUMA dica.',
  }[difficulty];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 18,
          backgroundColor: colors.bg,
        }}
      >
        <Topbar
          onLeft={() => setSettingsOpen(true)}
          leftIcon="⚙"
          leftVariant="white"
          right={
            <Badge
              label={`${players.length} jogadores`}
              bg={theme.colors.accent}
            />
          }
        />
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        style={{ backgroundColor: colors.bg }}
        keyboardShouldPersistTaps="handled"
      >
      <Section title="Jogadores" emoji="👥">
        <Text style={styles.hint}>
          Mínimo 3, máximo 20. Toque no nome para editar.
        </Text>
        {players.map((p, i) => {
          const c = colorFor(i);
          return (
            <MotiView
              key={`player-${i}`}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 180 }}
              style={[
                styles.playerRow,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.chip,
                  { backgroundColor: c.bg, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.chipTxt, { color: c.text }]}>{i + 1}</Text>
              </View>
              <TextInput
                value={p.name}
                onChangeText={(t) => renamePlayer(i, t.slice(0, 14))}
                maxLength={14}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.ink,
                  },
                ]}
                placeholderTextColor={colors.textMuted}
              />
              <Pressable
                onPress={() => {
                  if (players.length <= 3) {
                    showToast('Mínimo de 3 jogadores', 'warning');
                    haptic.warning();
                    return;
                  }
                  removePlayer(i);
                  haptic.tap();
                  playSound('click');
                }}
                style={styles.removeBtn}
              >
                <Text style={styles.removeTxt}>✕</Text>
              </Pressable>
            </MotiView>
          );
        })}
        <View style={styles.addRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Nome do jogador"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                flex: 1,
                marginRight: 8,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.ink,
              },
            ]}
            maxLength={14}
            onSubmitEditing={() => {
              if (newName.trim()) {
                addPlayer(newName);
                setNewName('');
                haptic.tap();
                playSound('pop');
              }
            }}
            returnKeyType="done"
          />
          <Button
            label="+ Add"
            variant="dark"
            size="sm"
            onPress={() => {
              if (players.length >= 20) {
                showToast('Máximo de 20', 'warning');
                return;
              }
              addPlayer(newName);
              setNewName('');
              playSound('pop');
            }}
            style={{ width: 80 }}
          />
        </View>
      </Section>

      <Section title="Impostores" emoji="🕵️">
        <View style={styles.counterRow}>
          <Pressable
            style={[
              styles.counterBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              setImpostorCount(impostorCount - 1);
              haptic.tap();
              playSound('ui');
            }}
          >
            <Text style={[styles.counterTxt, { color: colors.ink }]}>−</Text>
          </Pressable>
          <Text style={[styles.counterVal, { color: colors.ink }]}>
            {impostorCount}
          </Text>
          <Pressable
            style={[
              styles.counterBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              setImpostorCount(impostorCount + 1);
              haptic.tap();
              playSound('ui');
            }}
          >
            <Text style={[styles.counterTxt, { color: colors.ink }]}>+</Text>
          </Pressable>
        </View>
        <Text
          style={[
            styles.hint,
            { textAlign: 'center', marginTop: 6, color: colors.textMuted },
          ]}
        >
          {impostorCount === 1 ? '1 IMPOSTOR' : `${impostorCount} IMPOSTORES`}
        </Text>

        {impostorCount > 1 ? (
          <View style={styles.spyRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.spyLabel, { color: colors.ink }]}>
                🕵️🕵️ Modo Spy
              </Text>
              <Text style={styles.hint}>
                Os impostores se reconhecem (podem coordenar)
              </Text>
            </View>
            <Toggle
              on={spyMode}
              onChange={(v) => {
                setSpyMode(v);
                haptic.tap();
                playSound('ui');
              }}
            />
          </View>
        ) : null}
      </Section>

      <Section
        title="Timer de discussão"
        emoji="⏱️"
        right={
          <Toggle
            on={timerOn}
            onChange={(v) => {
              setTimerOn(v);
              haptic.tap();
              playSound('ui');
            }}
          />
        }
      >
        {timerOn ? (
          <View style={styles.timerSliderRow}>
            <Text style={styles.sliderEdge}>1m</Text>
            <View style={{ flex: 1 }}>
              <Slider
                min={1}
                max={10}
                step={1}
                value={timerMinutes}
                onChange={setTimerMinutes}
              />
            </View>
            <Text style={styles.sliderEdge}>10m</Text>
            <View style={styles.sliderValBadge}>
              <Text style={styles.sliderVal}>{timerMinutes}</Text>
            </View>
          </View>
        ) : null}
      </Section>

      <Section title="Modos especiais" emoji="🎲">
        <View style={styles.specialRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.specialLabel, { color: colors.ink }]}>
              🎭 Agente Duplo
            </Text>
            <Text style={styles.hint}>
              1 jogador vê a palavra mas conta como impostor
            </Text>
          </View>
          <Toggle
            on={doubleAgentMode}
            onChange={(v) => {
              setDoubleAgentMode(v);
              haptic.tap();
              playSound('ui');
            }}
          />
        </View>
        <View style={styles.specialDivider} />
        <View style={styles.specialRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.specialLabel, { color: colors.ink }]}>
              🗳️ Votação no App
            </Text>
            <Text style={styles.hint}>
              Grupo escolhe o impostor tocando no app (em vez de discussão livre)
            </Text>
          </View>
          <Toggle
            on={voteMode}
            onChange={(v) => {
              setVoteMode(v);
              haptic.tap();
              playSound('ui');
            }}
          />
        </View>
      </Section>

      <Section title="Dificuldade" emoji="🎯">
        <PillGroup
          options={[
            { id: 'easy', label: 'Fácil' },
            { id: 'normal', label: 'Normal' },
            { id: 'hard', label: 'Difícil' },
          ]}
          value={difficulty}
          onChange={(v) => setDifficulty(v as 'easy' | 'normal' | 'hard')}
        />
        <Text style={styles.hint}>{diffDesc}</Text>
      </Section>

      <Section title="Categorias" emoji="📚">
        <View style={styles.catGrid}>
          {CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  toggleCategory(cat.id);
                  haptic.tap();
                  playSound('ui');
                }}
                style={[
                  styles.catCard,
                  {
                    backgroundColor: selected ? colors.accent : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.catTag}>GRÁTIS</Text>
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.catName,
                    { color: selected ? theme.colors.ink : colors.ink },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.catActions}>
          <Button
            label="Selecionar todas"
            variant="dark"
            size="sm"
            onPress={() => setAllCategories(true)}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label="Limpar"
            variant="ghost"
            size="sm"
            onPress={() => setAllCategories(false)}
            style={{ flex: 1 }}
          />
        </View>
      </Section>

      <Button label="▶ Iniciar Jogo" variant="primary" onPress={handleStart} />
      <View style={{ height: 10 }} />
      <Button
        label="← Voltar"
        variant="ghost"
        onPress={() => router.replace('/')}
      />
      </ScrollView>
      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18 },
  hint: { color: '#999', fontSize: 12, marginBottom: 6, fontFamily: theme.font.bodyMid },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.grayLight,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  chip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTxt: { fontFamily: theme.font.bodyHeavy, fontSize: 14 },
  input: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: theme.font.body,
    fontSize: 14,
    color: theme.colors.ink,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: theme.colors.danger,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTxt: {
    color: theme.colors.white,
    fontFamily: theme.font.bodyHeavy,
    fontSize: 14,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    justifyContent: 'center',
  },
  counterBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterTxt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 20,
    color: theme.colors.ink,
  },
  counterVal: {
    fontFamily: theme.font.display,
    fontSize: 36,
    minWidth: 48,
    textAlign: 'center',
    color: theme.colors.ink,
  },
  spyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#eee',
    borderStyle: 'dashed',
  },
  spyLabel: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 14,
    color: theme.colors.ink,
  },
  specialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  specialLabel: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 14,
    color: theme.colors.ink,
  },
  specialDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },

  pillGroup: {
    flexDirection: 'row',
    backgroundColor: '#f3f3f3',
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: theme.colors.ink },
  pillTxt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    color: theme.colors.ink,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pillTxtActive: { color: theme.colors.white },

  toggle: {
    width: 54,
    height: 30,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 999,
  },

  timerSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  sliderEdge: { fontFamily: theme.font.bodyHeavy, fontSize: 12, color: '#666' },
  sliderValBadge: {
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 38,
    alignItems: 'center',
  },
  sliderVal: {
    fontFamily: theme.font.display,
    fontSize: 22,
    color: theme.colors.ink,
    letterSpacing: 1,
  },

  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 78,
    justifyContent: 'center',
    position: 'relative',
  },
  catTag: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 9,
    backgroundColor: theme.colors.accent,
    borderWidth: 1.5,
    borderColor: theme.colors.ink,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    fontFamily: theme.font.bodyHeavy,
    letterSpacing: 0.5,
    color: theme.colors.ink,
  },
  catEmoji: { fontSize: 22 },
  catName: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 13,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  catActions: { flexDirection: 'row', marginTop: 10 },
});
