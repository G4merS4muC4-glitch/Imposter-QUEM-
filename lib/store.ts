import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES, type Category, type Word } from './words';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Mode = 'classic' | 'silent';
export type SoundPack = 'classic' | 'retro' | 'cinema' | 'cyber';

export type Player = { name: string };

type RoundState = {
  impostors: number[];
  doubleAgents: number[];
  word: Word | null;
  category: Category | null;
  starterIndex: number;
  currentPlayer: number;
  revealed: boolean;
  // jogador(es) acusado(s) na votação (índices). Vazio até votação confirmar.
  accused: number[];
};

export type PlayerStats = {
  roundsPlayed: number;
  timesImpostor: number;
  timesDoubleAgent: number;
  timesCaught: number; // foi impostor/DA e o grupo acertou
  timesEscaped: number; // foi impostor/DA e o grupo errou
  timesAccusedWrong: number; // foi acusado por engano (modo voto)
};

type PersistedSlice = {
  players: Player[];
  impostorCount: number;
  mode: Mode;
  musicOn: boolean;
  spyMode: boolean;
  doubleAgentMode: boolean;
  voteMode: boolean;
  timerOn: boolean;
  timerMinutes: number;
  difficulty: Difficulty;
  selectedCategories: string[];
  scores: Record<string, number>;
  stats: Record<string, PlayerStats>;
  hasSeenOnboarding: boolean;
  soundPack: SoundPack;
};

const emptyStats: PlayerStats = {
  roundsPlayed: 0,
  timesImpostor: 0,
  timesDoubleAgent: 0,
  timesCaught: 0,
  timesEscaped: 0,
  timesAccusedWrong: 0,
};

type GameState = PersistedSlice & {
  round: RoundState;

  // mutations
  addPlayer: (name?: string) => void;
  removePlayer: (idx: number) => void;
  renamePlayer: (idx: number, name: string) => void;
  setImpostorCount: (n: number) => void;
  setMode: (m: Mode) => void;
  setMusicOn: (on: boolean) => void;
  setSpyMode: (on: boolean) => void;
  setDoubleAgentMode: (on: boolean) => void;
  setVoteMode: (on: boolean) => void;
  setTimerOn: (on: boolean) => void;
  markOnboardingSeen: () => void;
  resetStats: () => void;
  setSoundPack: (p: SoundPack) => void;
  setTimerMinutes: (m: number) => void;
  setDifficulty: (d: Difficulty) => void;
  toggleCategory: (id: string) => void;
  setAllCategories: (all: boolean) => void;
  resetScores: () => void;

  // round flow
  startRound: () => boolean;
  nextPlayer: () => void;
  prevPlayer: () => void;
  setRevealed: (v: boolean) => void;
  setAccused: (indices: number[]) => void;
  applyScore: (groupCorrect: boolean) => void;
  // helper para o modo voto: aplica score baseado em quem foi acusado
  applyVoteScore: () => boolean; // retorna se o grupo acertou
};

const initialRound: RoundState = {
  impostors: [],
  doubleAgents: [],
  word: null,
  category: null,
  starterIndex: 0,
  currentPlayer: 0,
  revealed: false,
  accused: [],
};

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};
const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      players: [
        { name: 'Jogador 1' },
        { name: 'Jogador 2' },
        { name: 'Jogador 3' },
      ],
      impostorCount: 1,
      mode: 'classic',
      musicOn: true,
      spyMode: false,
      doubleAgentMode: false,
      voteMode: false,
      timerOn: false,
      timerMinutes: 3,
      difficulty: 'normal',
      selectedCategories: CATEGORIES.map((c) => c.id),
      scores: {},
      stats: {},
      hasSeenOnboarding: false,
      soundPack: 'classic',
      round: initialRound,

      addPlayer: (name) =>
        set((s) => {
          if (s.players.length >= 20) return s;
          const nm = (name ?? '').trim() || `Jogador ${s.players.length + 1}`;
          return { players: [...s.players, { name: nm }] };
        }),

      removePlayer: (idx) =>
        set((s) => {
          if (s.players.length <= 3) return s;
          const players = s.players.filter((_, i) => i !== idx);
          const maxImp = Math.max(1, Math.floor(players.length / 2));
          return {
            players,
            impostorCount: Math.min(s.impostorCount, maxImp),
          };
        }),

      renamePlayer: (idx, name) =>
        set((s) => ({
          players: s.players.map((p, i) => (i === idx ? { name } : p)),
        })),

      setImpostorCount: (n) =>
        set((s) => {
          const maxImp = Math.max(1, Math.floor(s.players.length / 2));
          return { impostorCount: Math.min(Math.max(1, n), maxImp) };
        }),

      setMode: (m) => set({ mode: m }),
      setMusicOn: (on) => set({ musicOn: on }),
      setSpyMode: (on) => set({ spyMode: on }),
      setDoubleAgentMode: (on) => set({ doubleAgentMode: on }),
      setVoteMode: (on) => set({ voteMode: on }),
      setTimerOn: (on) => set({ timerOn: on }),
      markOnboardingSeen: () => set({ hasSeenOnboarding: true }),
      resetStats: () => set({ stats: {} }),
      setSoundPack: (p) => set({ soundPack: p }),
      setTimerMinutes: (m) => set({ timerMinutes: Math.min(10, Math.max(1, m)) }),
      setDifficulty: (d) => set({ difficulty: d }),

      toggleCategory: (id) =>
        set((s) => {
          const has = s.selectedCategories.includes(id);
          return {
            selectedCategories: has
              ? s.selectedCategories.filter((x) => x !== id)
              : [...s.selectedCategories, id],
          };
        }),

      setAllCategories: (all) =>
        set({ selectedCategories: all ? CATEGORIES.map((c) => c.id) : [] }),

      resetScores: () => {
        const players = get().players;
        const scores: Record<string, number> = {};
        players.forEach((p) => (scores[p.name] = 0));
        set({ scores });
      },

      startRound: () => {
        const s = get();
        if (s.players.length < 3) return false;
        if (s.selectedCategories.length === 0) return false;
        if (s.impostorCount >= s.players.length) return false;
        const cats = CATEGORIES.filter((c) =>
          s.selectedCategories.includes(c.id),
        );
        if (cats.length === 0) return false;
        const cat = rand(cats);
        const word = rand(cat.words);
        const indices = s.players.map((_, i) => i);
        const shuffled = shuffle(indices);
        const impostors = shuffled.slice(0, s.impostorCount);

        // Agente Duplo: 1 jogador não-impostor que vê a palavra mas conta como impostor
        let doubleAgents: number[] = [];
        if (s.doubleAgentMode) {
          const nonImpostors = shuffled.slice(s.impostorCount);
          if (nonImpostors.length > 0 && nonImpostors[0] !== undefined) {
            doubleAgents = [nonImpostors[0]];
          }
        }

        const starterIndex = Math.floor(Math.random() * s.players.length);
        const scores = { ...s.scores };
        const stats = { ...s.stats };
        s.players.forEach((p, idx) => {
          if (scores[p.name] === undefined) scores[p.name] = 0;
          const cur = stats[p.name] ?? { ...emptyStats };
          stats[p.name] = {
            ...cur,
            roundsPlayed: cur.roundsPlayed + 1,
            timesImpostor:
              cur.timesImpostor + (impostors.includes(idx) ? 1 : 0),
            timesDoubleAgent:
              cur.timesDoubleAgent + (doubleAgents.includes(idx) ? 1 : 0),
          };
        });
        set({
          round: {
            impostors,
            doubleAgents,
            word,
            category: cat,
            starterIndex,
            currentPlayer: 0,
            revealed: false,
            accused: [],
          },
          scores,
          stats,
        });
        return true;
      },

      nextPlayer: () =>
        set((s) => {
          if (s.round.currentPlayer < s.players.length - 1) {
            return {
              round: {
                ...s.round,
                currentPlayer: s.round.currentPlayer + 1,
                revealed: false,
              },
            };
          }
          return s;
        }),

      prevPlayer: () =>
        set((s) => {
          if (s.round.currentPlayer > 0) {
            return {
              round: {
                ...s.round,
                currentPlayer: s.round.currentPlayer - 1,
                revealed: false,
              },
            };
          }
          return s;
        }),

      setRevealed: (v) =>
        set((s) => ({ round: { ...s.round, revealed: v } })),

      setAccused: (indices) =>
        set((s) => ({ round: { ...s.round, accused: indices } })),

      applyScore: (groupCorrect) =>
        set((s) => {
          const scores = { ...s.scores };
          const stats = { ...s.stats };
          const targets = new Set<number>([
            ...s.round.impostors,
            ...s.round.doubleAgents,
          ]);
          const accusedSet = new Set<number>(s.round.accused);
          s.players.forEach((p, i) => {
            const isTarget = targets.has(i);
            if (!isTarget) {
              if (groupCorrect) {
                scores[p.name] = (scores[p.name] ?? 0) + 1;
                if (i === s.round.starterIndex)
                  scores[p.name] = (scores[p.name] ?? 0) + 1;
              } else {
                scores[p.name] = (scores[p.name] ?? 0) + 2;
              }
              // estatística: inocente acusado por engano
              if (accusedSet.has(i)) {
                const cur = stats[p.name] ?? { ...emptyStats };
                stats[p.name] = {
                  ...cur,
                  timesAccusedWrong: cur.timesAccusedWrong + 1,
                };
              }
            } else {
              if (!groupCorrect) scores[p.name] = (scores[p.name] ?? 0) + 3;
              const cur = stats[p.name] ?? { ...emptyStats };
              stats[p.name] = {
                ...cur,
                timesCaught: cur.timesCaught + (groupCorrect ? 1 : 0),
                timesEscaped: cur.timesEscaped + (groupCorrect ? 0 : 1),
              };
            }
          });
          return { scores, stats };
        }),

      applyVoteScore: () => {
        const s = get();
        const targets = new Set<number>([
          ...s.round.impostors,
          ...s.round.doubleAgents,
        ]);
        // grupo acerta se TODOS os acusados são targets E a contagem de
        // acusados bate com a de targets (acharam todo mundo)
        const accusedAllTargets = s.round.accused.every((idx) =>
          targets.has(idx),
        );
        const allFound = s.round.accused.length === targets.size;
        const groupCorrect = accusedAllTargets && allFound;
        get().applyScore(groupCorrect);
        return groupCorrect;
      },
    }),
    {
      name: 'impostor-quem-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): PersistedSlice => ({
        players: s.players,
        impostorCount: s.impostorCount,
        mode: s.mode,
        musicOn: s.musicOn,
        spyMode: s.spyMode,
        doubleAgentMode: s.doubleAgentMode,
        voteMode: s.voteMode,
        timerOn: s.timerOn,
        timerMinutes: s.timerMinutes,
        difficulty: s.difficulty,
        selectedCategories: s.selectedCategories,
        scores: s.scores,
        stats: s.stats,
        hasSeenOnboarding: s.hasSeenOnboarding,
        soundPack: s.soundPack,
      }),
    },
  ),
);
