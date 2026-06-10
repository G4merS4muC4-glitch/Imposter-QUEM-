import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Dimensions,
  Pressable,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { theme } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/audio';

const { width: SCREEN_W } = Dimensions.get('window');

type Slide = {
  emoji: string;
  title: string;
  subtitle: string;
  body: string;
  bg: string;
};

const SLIDES: Slide[] = [
  {
    emoji: '🕵️',
    title: 'IMPOSTOR QUEM?',
    subtitle: 'Bem-vindo ao caos!',
    body: 'Um jogo de party pra grupos. Um celular, vários jogadores, uma palavra secreta — e alguém mentindo.',
    bg: theme.colors.accent,
  },
  {
    emoji: '📱',
    title: 'PASSE O CELULAR',
    subtitle: 'Cada um vê em segredo',
    body: 'Segure o card por 1 segundo pra revelar sua palavra. Não mostre pros outros! O impostor não recebe a palavra.',
    bg: '#FFD600',
  },
  {
    emoji: '🗣️',
    title: 'DESCREVA SEM DIZER',
    subtitle: 'Todos falam, todos desconfiam',
    body: 'Quem sabe a palavra a descreve indiretamente. O impostor finge que sabe. Achem o farsante!',
    bg: '#4FC3F7',
  },
  {
    emoji: '🎲',
    title: 'MODOS ESPECIAIS',
    subtitle: 'Vire o jogo de cabeça pra baixo',
    body: '🎭 Agente Duplo, 🕵️🕵️ Spy, 🗳️ Votação, ⏱️ Timer. Mude tudo no Setup pra cada partida.',
    bg: '#CE93D8',
  },
];

type Props = {
  onDone: () => void;
};

export function Onboarding({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (p !== page) {
      setPage(p);
      haptic.tap();
    }
  };

  const goNext = () => {
    haptic.tap();
    playSound('whoosh');
    if (page < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: page + 1, animated: true });
    } else {
      playSound('boot');
      onDone();
    }
  };

  const goSkip = () => {
    haptic.tap();
    playSound('ui');
    onDone();
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <MotiView
        from={{ scale: 0, rotate: '12deg' }}
        animate={{ scale: 1, rotate: '-3deg' }}
        transition={{ type: 'spring', damping: 10, mass: 0.8 }}
        style={[styles.emojiCard, { backgroundColor: item.bg }]}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
      </MotiView>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  return (
    <View
      style={[
        styles.bg,
        { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 },
      ]}
    >
      {/* skip top-right */}
      <View style={styles.skipRow}>
        <View style={{ flex: 1 }} />
        {page < SLIDES.length - 1 ? (
          <Pressable onPress={goSkip} hitSlop={12}>
            <Text style={styles.skipTxt}>Pular</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(_, i) => `slide-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />

      {/* dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <MotiView
            key={i}
            animate={{
              width: i === page ? 28 : 10,
              backgroundColor:
                i === page ? theme.colors.ink : 'rgba(26,26,26,0.25)',
            }}
            transition={{ type: 'timing', duration: 240 }}
            style={styles.dot}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Button
          label={page < SLIDES.length - 1 ? 'PRÓXIMO ▶' : 'COMEÇAR! 🚀'}
          variant="primary"
          onPress={goNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.bg,
    zIndex: 100,
  },
  skipRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginBottom: 6,
  },
  skipTxt: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 14,
    color: '#777',
    padding: 4,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCard: {
    width: 180,
    height: 180,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emoji: { fontSize: 100 },
  title: {
    fontFamily: theme.font.display,
    fontSize: 44,
    letterSpacing: 1,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.font.bodyHeavy,
    fontSize: 14,
    color: theme.colors.accentShadow,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
    textAlign: 'center',
  },
  body: {
    fontFamily: theme.font.bodyMid,
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
    maxWidth: 320,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  cta: {
    paddingHorizontal: 24,
  },
});
