# 📦 Como gerar APK + colocar offline no iPhone

Tudo já está **pré-configurado**: o [eas.json](eas.json) já tem os profiles `preview` (APK Android instalável) e `production`. O [app.json](app.json) tem `bundleIdentifier` e `package` corretos. Você só precisa rodar 3 comandos no terminal.

---

## 🤖 ANDROID — gerar APK pra mandar pros amigos

### Pré-requisitos (uma vez só)

```powershell
# Conta Expo gratuita — abre o navegador pra você cadastrar
npx expo register
# OU se já tem conta:
npx expo login

# Instala EAS CLI globalmente
npm install -g eas-cli

# Linka esse projeto na sua conta Expo (cria projectId no app.json)
eas init
```

**Atenção**: na hora do `eas init` ele pode pedir pra criar um projeto novo — aceita. Vai escrever `extra.eas.projectId` no `app.json` automaticamente.

### Buildar o APK

```powershell
eas build --platform android --profile preview
```

O que acontece:
1. EAS faz upload do seu código pra nuvem deles (~30 segundos)
2. Entra numa **fila gratuita** (~5-15 min de espera)
3. Compila o APK na nuvem (~5-10 min)
4. Te dá um **link público** pra baixar o `.apk`

Quando terminar, você recebe algo tipo:
```
✔ Build finished
🤖 Android app: https://expo.dev/artifacts/eas/abc123.apk
```

### Distribuir pros amigos

1. **Baixa o `.apk`** desse link
2. **Manda no WhatsApp / Drive / Telegram** pra galera
3. Eles tocam no arquivo no Android:
   - "Instalar de fonte desconhecida?" → **Permitir**
   - Instala como qualquer app
4. **Pronto, app na home do celular deles** 🎮

### Plano grátis do EAS

- **30 builds Android grátis por mês**
- Tempo na fila pode variar de 5min a 30min
- Build em si: ~10 min na máquina deles

---

## 🍎 IPHONE — opções pra rodar offline

Aqui é mais chato porque a Apple bloqueia instalação direta de `.ipa` sem pagar. Tem 3 caminhos, do mais fácil ao mais profissional:

### 🥇 Opção A — Sideloadly (grátis, melhor relação custo-benefício)

**Limite**: app expira a cada **7 dias** com Apple ID grátis → precisa reinstalar.
Com Apple Developer Account pago ($99/ano): **válido por 1 ano** sem renovar.

**Passos:**

1. **No PC**: instalar **Sideloadly** → https://sideloadly.io (Windows ou Mac)

2. **No projeto**: build do IPA via EAS:
   ```powershell
   eas build --platform ios --profile preview
   ```
   Vai pedir credenciais Apple. Use sua Apple ID pessoal (grátis). Esse profile já tá configurado pra **internal distribution** (não precisa Apple Developer pago).

3. **Baixa o `.ipa`** do link que aparece quando o build termina

4. **No Sideloadly**:
   - Conecta o iPhone no PC via cabo
   - Arrasta o `.ipa` pra janela do Sideloadly
   - Coloca sua Apple ID (a mesma que tá no iPhone)
   - Clica em **Start**

5. **No iPhone**: vai aparecer o app na home, mas **bloqueado** na primeira vez
   - Vá em **Ajustes → Geral → VPN e Gerenciamento de Dispositivo**
   - Confia no seu desenvolvedor (sua Apple ID)
   - Abre o app → roda OFFLINE perfeito

**A cada 7 dias**: repete os passos 4-5 (não precisa rebuildar, usa o mesmo `.ipa`).

### 🥈 Opção B — TestFlight (pago, profissional)

**Custo**: US$ 99/ano (Apple Developer Program)
**Limite**: até 100 testadores convidados por email, válido por 90 dias

```powershell
# Build com profile production
eas build --platform ios --profile production
# Submeter pra TestFlight (Apple revisa em ~24h)
eas submit --platform ios
```

Depois você convida amigos por email no [App Store Connect](https://appstoreconnect.apple.com). Eles instalam o app **TestFlight** na App Store, aceitam o convite, baixam seu app. Funciona offline normal.

### 🥉 Opção C — App Store (publicação oficial)

Mesmos US$ 99/ano. Após o TestFlight estar bom, submete pra revisão da App Store (~3-7 dias). Qualquer um baixa pela App Store. Sem limite de instalações.

### ⚠️ Opção D — Esquece o offline, use Expo Go

Se você só vai jogar com a galera fisicamente, sempre na mesma Wi-Fi, é o caminho mais simples:
1. Você roda `npm start` no PC
2. Amigos abrem **Expo Go** no celular deles
3. Scaneiam o QR
4. Joga

**Não é offline**, mas é **0% setup**.

---

## 🎯 Recomendação prática

**Pra começar este fim de semana com amigos:**

| Plataforma | Comando | Tempo | Custo |
|---|---|---|---|
| Android | `eas build --platform android --profile preview` | ~20 min total | Grátis |
| iPhone (Sideloadly) | `eas build --platform ios --profile preview` + Sideloadly | ~30 min total | Grátis (renova 7d) |

**Pra publicar de verdade depois:**
- Play Store: US$ 25 conta única vitalícia
- App Store: US$ 99/ano

---

## 🛠 Antes de buildar — checklist

- [x] `eas.json` configurado (já está)
- [x] `app.json` com `bundleIdentifier` (já está: `com.samue.impostorquem`)
- [x] `app.json` com `package` Android (já está)
- [x] `app.json` com `version: "1.0.0"`
- [ ] Logado no Expo (`npx expo login`)
- [ ] EAS CLI instalado (`npm i -g eas-cli`)
- [ ] Projeto inicializado (`eas init`)
- [ ] (Opcional) Criar `assets/icon.png` 1024×1024 — sem isso, Expo usa ícone padrão verde

### 🎨 Gerar ícone rápido

Se quiser um ícone customizado:
1. Vai em https://icon.kitchen ou https://easyappicon.com
2. Faz um PNG quadrado 1024×1024 com o "QUEM?" verde-limão num fundo escuro
3. Salva como `assets/icon.png`
4. Adiciona no `app.json`:
   ```json
   "icon": "./assets/icon.png",
   "android": {
     "adaptiveIcon": {
       "foregroundImage": "./assets/icon.png",
       "backgroundColor": "#AAEE00"
     }
   }
   ```

---

## 🔧 Troubleshooting

| Erro | Solução |
|---|---|
| `EAS project not configured` | Rode `eas init` antes do build |
| `Apple credentials needed` | No build iOS, EAS pede Apple ID — pode usar a sua grátis |
| `Build queue full` | Espera ~30 min, free tier tem prioridade baixa em horários de pico |
| `Invalid bundle identifier` | Confere se `com.samue.impostorquem` no `app.json` |
| Amigo Android não consegue instalar | Pede pra ele ativar "Instalar apps de fontes desconhecidas" nas configurações |

---

## 🔗 Links úteis

- EAS Build docs: https://docs.expo.dev/build/introduction/
- Sideloadly: https://sideloadly.io/
- App Icon: https://icon.kitchen / https://easyappicon.com
- Play Console (Android): https://play.google.com/console
- App Store Connect (iOS): https://appstoreconnect.apple.com
