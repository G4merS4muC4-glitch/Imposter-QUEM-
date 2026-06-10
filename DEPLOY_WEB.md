# 🌐 Publicar na Vercel + jogar OFFLINE no iPhone/Android

A pasta [web/](web/) é um **PWA completo** (Progressive Web App): o jogo inteiro num
`index.html` + service worker + manifest + ícones. Depois de publicado, qualquer
pessoa abre o link, **adiciona à tela de início** e o jogo vira um "app" que
**funciona 100% offline** — sem App Store, sem Play Store, sem Expo Go.

```
web/
├── index.html            ← o jogo (20 categorias, ~640 palavras)
├── manifest.webmanifest  ← nome, ícones, modo standalone
├── sw.js                 ← service worker (cache offline)
└── icons/                ← ícones PNG (home screen, favicon)
```

---

## Passo 1 — Subir pro GitHub (~5 min)

1. Crie uma conta em https://github.com (se não tiver)
2. Crie um repositório novo: https://github.com/new
   - Nome: `impostor-quem` (ou o que quiser)
   - **Private** ou Public, tanto faz pra Vercel
   - NÃO marque "Add a README" (o projeto já tem)
3. No terminal do VS Code (pasta GAME), o git já está inicializado e commitado.
   Conecte e envie:

```powershell
git remote add origin https://github.com/SEU_USUARIO/impostor-quem.git
git push -u origin main
```

(O Git vai abrir o navegador pra você autorizar na primeira vez.)

## Passo 2 — Deploy na Vercel (~3 min)

1. Crie conta em https://vercel.com → **"Continue with GitHub"**
2. **Add New… → Project** → escolha o repositório `impostor-quem`
3. **NÃO mude nada** — o [vercel.json](vercel.json) já configura tudo
   (sem build, serve a pasta `web/`, headers de cache corretos)
4. **Deploy** → em ~30 segundos você ganha um link tipo:
   `https://impostor-quem.vercel.app`

Pronto. Esse link é permanente e gratuito. Cada `git push` redeploya sozinho.

## Passo 3 — Amigos instalam no celular (offline!)

### 🍎 iPhone (Safari)
1. Abre o link no **Safari** (tem que ser Safari!)
2. Toca no botão **Compartilhar** (quadrado com seta ↑)
3. **"Adicionar à Tela de Início"**
4. O ícone verde "Impostor" aparece na home
5. Abrindo por esse ícone: **tela cheia, sem barra do navegador, funciona SEM internet** ✈️

### 🤖 Android (Chrome)
1. Abre o link no Chrome
2. Aparece o banner **"Instalar app"** (ou Menu ⋮ → "Instalar app")
3. Instala → ícone na home → funciona offline

> ⚠️ **Importante**: a pessoa precisa abrir o link **online pelo menos uma vez**
> (é aí que o service worker baixa e cacheia tudo, inclusive as fontes).
> Depois disso, avião, sítio sem sinal, rolê — funciona em qualquer lugar.

---

## Atualizar o jogo depois

1. Edite `web/index.html` (palavras novas, fixes…)
2. **Incremente a versão** em `web/sw.js`: `const VERSION = 'v1.0.0'` → `'v1.0.1'`
   (sem isso os celulares continuam usando a versão cacheada antiga!)
3. Commit + push:
```powershell
git add -A
git commit -m "novas palavras"
git push
```
4. Vercel redeploya sozinho. Os celulares pegam a nova versão na próxima
   abertura **com internet** (o SW atualiza em background).

---

## Alternativa: GitHub Pages (sem Vercel)

Também funciona, é 100% estático:
1. No repo GitHub: **Settings → Pages**
2. Source: **Deploy from a branch** → branch `main`, pasta `/web`... 
   (GitHub Pages só aceita `/` ou `/docs` — se quiser usar Pages, renomeie
   `web/` para `docs/` e ajuste o vercel.json)

Vercel é mais simples pro nosso layout. Recomendo ficar nela.

---

## Limitações do PWA vs app nativo (Expo)

| | PWA (web/) | App nativo (Expo) |
|---|---|---|
| Instalação | Link → "Adicionar à tela" | APK / TestFlight |
| Offline | ✅ total (após 1ª visita) | ✅ total |
| Sons | ✅ Web Audio | ✅ expo-av |
| Vibração | ✅ Android / ❌ iOS (Safari não suporta) | ✅ ambos |
| Tela sempre ligada | ✅ (Wake Lock, iOS 16.4+) | ✅ |
| Tilt 3D no card | ❌ | ✅ |
| Música de fundo | ❌ (só no nativo) | ✅ |
| Modos Spy/Agente Duplo/Votação | ❌ (só no nativo) | ✅ |

O PWA é a versão "leve e instantânea" pra galera; o app Expo continua sendo a
versão completa pra publicar nas lojas depois.
