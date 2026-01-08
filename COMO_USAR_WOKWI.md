# 🚀 GUIA RÁPIDO: Como Conectar o Wokwi

## ⚡ 3 Passos Simples

### 📝 Passo 1: Criar Projeto no Wokwi

1. Abra: https://wokwi.com/
2. Faça login (se necessário)
3. Clique em **"New Project"**
4. Selecione **"ESP32"**

---

### 💻 Passo 2: Copiar o Código

1. **Copie TODO o código** do arquivo: `hybrid_engine_websocket.ino`
2. **Cole no editor** do Wokwi (substitua tudo que está lá)

**OU**

Use o projeto já pronto:
👉 https://wokwi.com/projects/452473775385515009

---

### 📚 Passo 3: Adicionar Biblioteca WebSocket

**IMPORTANTE:** O Wokwi precisa da biblioteca WebSocket!

1. No Wokwi, clique em **"Library Manager"** (ícone de livro 📚)
2. Procure por: **"WebSockets"**
3. Instale: **"WebSockets by Markus Sattler"**
4. Aguarde a instalação

---

### ▶️ Passo 4: Rodar a Simulação

1. Clique no botão **Play** ▶️ (verde)
2. Aguarde aparecer no Serial Monitor:
   ```
   🚀 SKYBLUE Hybrid Engine - WebSocket Edition
   📡 Connecting to WiFi...
   ✅ WiFi connected!
      IP address: 192.168.1.100
   🌐 WebSocket server started on port 8080
   👉 Connect your interface to:
      ws://192.168.1.100:8080
   ```

---

### 🔗 Passo 5: Conectar a Interface

#### **Opção A: Localmente (npm run dev)**

1. Certifique-se que `npm run dev` está rodando
2. Abra: http://localhost:5173
3. Clique no botão **"HW Link"** (canto superior direito)
4. ✅ **Conectado!** Você verá dados em tempo real!

#### **Opção B: Live Demo (Vercel)**

1. Abra: https://skyblue-hybrid-engine.vercel.app
2. Clique no botão **"HW Link"**
3. ✅ **Conectado!**

---

## 🎮 Como Usar Depois de Conectado

### 1. **Ligar o Sistema**
- Clique em **"MASTER POWER"** (fica verde)

### 2. **Controlar Throttle**
- Use o slider para ajustar potência (0-100%)
- Veja o thrust aumentar nos gráficos

### 3. **Ligar ICE (Motor a Combustão)**
- Clique em **"ICE ENGINE"** (fica laranja)
- Combustível começa a ser consumido

### 4. **Mudar Modo**
- Clique em **"MODE"** para alternar:
  - **ELECTRIC** (verde) - Só bateria
  - **HYBRID** (azul) - Bateria + ICE
  - **CHARGING** (roxo) - ICE carrega bateria

### 5. **Emergência**
- Clique em **"ABORT / KILL"** para desligar tudo

---

## 🐛 Problemas Comuns

### ❌ "WebSocket connection failed"

**Solução:**
1. Verifique se a simulação está rodando (Play ▶️)
2. Veja se apareceu "WiFi connected" no Serial Monitor
3. Tente clicar em "HW Link" novamente

### ❌ "Library not found: WebSocketsServer.h"

**Solução:**
1. No Wokwi, clique em **"Library Manager"**
2. Procure **"WebSockets"**
3. Instale **"WebSockets by Markus Sattler"**
4. Clique em Play novamente

### ❌ "Dados não aparecem"

**Solução:**
1. Verifique se "HW Link" está **verde** (Connected)
2. Clique em **"MASTER POWER"** para ligar o sistema
3. Ajuste o throttle para ver mudanças
4. Abra o console do navegador (F12) para ver logs

---

## ✅ Checklist Rápido

- [ ] Projeto criado no Wokwi
- [ ] Código copiado
- [ ] Biblioteca WebSockets instalada
- [ ] Play ▶️ clicado
- [ ] "WiFi connected" apareceu
- [ ] Interface aberta (local ou Vercel)
- [ ] "HW Link" clicado
- [ ] Status "Connected" (verde)
- [ ] "MASTER POWER" ligado
- [ ] Dados aparecendo!

---

## 🎯 Resumo Ultra-Rápido

```
1. Wokwi → New Project → ESP32
2. Colar código de hybrid_engine_websocket.ino
3. Library Manager → WebSockets → Instalar
4. Play ▶️
5. Interface → HW Link
6. ✅ PRONTO!
```

---

## 📞 Precisa de Ajuda?

1. **Clique em "Help"** na interface - documentação completa
2. **Veja o Serial Monitor** do Wokwi para logs
3. **Abra o Console** do navegador (F12) para erros

---

**Boa sorte! 🚀**

*Se tudo der certo, você verá gráficos em tempo real com dados do Wokwi!*
