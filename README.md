# 🕵️ IMPOSTOR QUEM?

Party game brasileiro — um celular passado entre jogadores. Um (ou mais) impostor não sabe a palavra secreta e precisa fingir que sabe.

## Estrutura

```
GAME/
├── index.html           ← Playtest rápido em qualquer browser (mantido)
├── app/                 ← Expo Router (telas)
│   ├── _layout.tsx
│   ├── index.tsx        ← Home
│   ├── setup.tsx        ← Configuração
│   ├── card.tsx         ← Revelação por jogador (hold-to-reveal)
│   ├── round.tsx        ← Discussão + timer
│   └── reveal.tsx       ← Revelação final + placar
├── components/          ← UI reutilizável
│   ├── Button.tsx
│   ├── Section.tsx
│   ├── Badge.tsx
│   ├── HoldCard.tsx
│   ├── TimerRing.tsx
│   ├── Confetti.tsx
│   ├── Sheet.tsx
│   ├── Toaster.tsx
│   └── Topbar.tsx
├── lib/                 ← Lógica/dados
│   ├── theme.ts
│   ├── colors.ts        ← 12 cores cíclicas por jogador
│   ├── words.ts         ← 15 categorias × 21 palavras (PT-BR)
│   ├── store.ts         ← Zustand + AsyncStorage (persist)
│   ├── audio.ts         ← Sintetiza sons via WAV/PCM em runtime
│   ├── haptics.ts
│   └── toast.ts
├── package.json
├── app.json
├── tsconfig.json
├── babel.config.js
└── metro.config.js
```

## Stack

- **Expo SDK 52** + **Expo Router 4** (file-based routing)
- **TypeScript** estrito
- **Reanimated 3** + **Moti** — animações 60fps na thread nativa
- **react-native-svg** — TimerRing
- **expo-haptics** — vibração nativa por estilo (light/medium/heavy/success/error)
- **expo-av** — áudio sintetizado (sem arquivos)
- **expo-blur** — backdrop dos modais
- **@expo-google-fonts** — Bebas Neue + Nunito
- **Zustand** + **AsyncStorage** — estado + persist (jogadores, placar, settings)

## Instalação

Requisitos: Node 18+, e:
- **Android**: Android Studio com emulador OU app **Expo Go** num celular Android.
- **iOS**: precisa de Mac para build local, OU usa **EAS Build** na nuvem (free tier disponível).

```bash
# dentro de C:\Users\samue\OneDrive\Documents\GAME
npm install
npm run start
```

No terminal do Expo:
- `a` abre no Android (emulador ou Expo Go)
- `i` abre no iOS (precisa Mac)
- `w` abre no browser (versão web — funcional mas sem haptics)

### Expo Go vs build próprio
A primeira fase usa **Expo Go** (instala da Play Store) — sem build, sem dor. Quando quisermos publicar ou usar libs não-Go (raro aqui), passamos para **development build** via `npx expo run:android` ou EAS.

## Persistência

Estado salvo em `AsyncStorage` com chave `impostor-quem-v1`:
- Jogadores (nomes)
- Contagem de impostores
- Modo (clássico/silencioso)
- Timer (on/off + minutos)
- Dificuldade
- Categorias selecionadas
- Placar da sessão

## Próximos passos (sugestões)

- [ ] Ícone + splash screen customizados (criar `assets/icon.png` 1024x1024)
- [ ] Lottie/Rive nas transições principais
- [ ] Suporte a custom-words (jogador cria a própria categoria)
- [ ] Compartilhar resultado ("Eu fui o impostor!" → imagem)
- [ ] Estatísticas históricas (quantas vezes cada um foi impostor, taxa de detecção)
- [ ] Internacionalização (PT/EN/ES)
- [ ] Publicar via EAS Build

## Playtest rápido

Enquanto não roda o Expo, abra `index.html` no browser (mobile DevTools 375×812). É a mesma mecânica que está sendo portada.
