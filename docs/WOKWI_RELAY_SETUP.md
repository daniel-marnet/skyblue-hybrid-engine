# 🚀 SKYBLUE Wokwi Relay Setup Guide

## Arquitetura v1.0 - Cloud Connected

```
┌──────────────────────────────────────────────────┐
│  Interface Web (Vercel)                          │
│  https://skyblue-hybrid-engine.vercel.app        │
│           ↕ SSE (Server-Sent Events)             │
│  Vercel Edge Function (Relay Server)             │
│  /api/websocket-relay                            │
│           ↕ HTTP POST/GET                        │
│  Wokwi Simulation (ESP32)                        │
│  https://wokwi.com/projects/452473775385515009   │
└──────────────────────────────────────────────────┘
```

---

## ✅ Passo 1: Deploy do Relay Server no Vercel

O relay server já está incluído no projeto em `/api/websocket-relay.js`.

### Comandos:

```bash
# 1. Commit das mudanças
git add .
git commit -m "Add Wokwi relay server for cloud connection"
git push origin main

# 2. Deploy automático no Vercel
# (O Vercel detecta automaticamente o /api folder)
```

### Verificar Deploy:

Acesse: `https://skyblue-hybrid-engine.vercel.app/api/websocket-relay/status`

Deve retornar:
```json
{
  "clients": 0,
  "wokwiConnected": false,
  "lastUpdate": null,
  "hasPendingCommand": false
}
```

---

## ✅ Passo 2: Configurar Wokwi

### 2.1 Abrir Wokwi Project

1. Acesse: https://wokwi.com/projects/452473775385515009
2. Clique em **"Edit"** (se não for seu projeto)
3. **OU** faça um fork para sua conta Wokwi

### 2.2 Atualizar o Código

Cole o código do arquivo `skyblue-hybrid-engine.ino` no editor Wokwi.

**IMPORTANTE:** Edite a linha 20 do código:

```cpp
// ANTES:
const char* RELAY_SERVER = "https://skyblue-hybrid-engine.vercel.app";

// DEPOIS (substitua pelo SEU domínio Vercel):
const char* RELAY_SERVER = "https://SEU-PROJETO.vercel.app";
```

### 2.3 Adicionar Biblioteca ArduinoJson

1. No Wokwi, clique em **"Library Manager"** (ícone de livro)
2. Procure por **"ArduinoJson"**
3. Instale a versão **6.x** (by Benoit Blanchon)

---

## ✅ Passo 3: Testar Conexão

### 3.1 Iniciar Wokwi

1. Clique em **Play ▶️** no Wokwi
2. Aguarde a mensagem no Serial Monitor:

```
=================================
SKYBLUE Hybrid Engine v1.0
Cloud-Connected Edition
=================================
Connecting to WiFi...
✓ WiFi connected!
IP address: 192.168.1.100
Relay server: https://seu-projeto.vercel.app
=================================

✓ Data sent | Bat: 80.0% | Fuel: 100.0% | Thrust: 0N
```

### 3.2 Verificar Relay Status

Abra em outra aba: `https://seu-projeto.vercel.app/api/websocket-relay/status`

Deve mostrar:
```json
{
  "clients": 0,
  "wokwiConnected": true,  ← IMPORTANTE: deve ser true
  "lastUpdate": 1704723456789,
  "hasPendingCommand": false
}
```

### 3.3 Abrir Interface Web

1. Acesse: https://seu-projeto.vercel.app
2. Clique no botão **"HW Link"** no canto superior direito
3. Deve conectar e mostrar **"Connected"** (verde)
4. Os dados do Wokwi devem aparecer em tempo real!

---

## ✅ Passo 4: Testar Controles

### 4.1 Na Interface Web:

1. **MASTER POWER** → Clique para ligar
2. **Throttle** → Mova o slider para 50%
3. **ICE ENGINE** → Clique para ligar motor de combustão
4. **MODE** → Alterne entre ELECTRIC / HYBRID / CHARGING

### 4.2 No Wokwi Serial Monitor:

Você deve ver:

```
→ Command: MASTER ON
→ Command: THROTTLE 50%
→ Command: ICE ON
→ Command: MODE 1
✓ Data sent | Bat: 79.2% | Fuel: 99.8% | Thrust: 2500N
```

### 4.3 Confirmação Visual:

- **LEDs no Wokwi** devem acender (Motor, ICE, Solar)
- **Gráficos na Interface** devem atualizar em tempo real
- **Métricas** devem mudar conforme você controla

---

## 🔧 Troubleshooting

### Problema: "wokwiConnected: false"

**Causa:** Wokwi não está enviando dados ao relay.

**Soluções:**
1. Verifique se clicou Play ▶️ no Wokwi
2. Confirme que WiFi conectou (Serial Monitor)
3. Verifique se URL do relay está correta no código
4. Adicione `https://` antes da URL
5. Certifique-se que ArduinoJson está instalado

---

### Problema: Interface mostra "Running in demonstration mode"

**Causa:** Variável de ambiente VITE_RELAY_URL não configurada.

**Solução:**

1. Crie arquivo `.env` na raiz do projeto:
   ```env
   VITE_RELAY_URL=https://seu-projeto.vercel.app
   ```

2. No Vercel Dashboard:
   - Settings → Environment Variables
   - Add: `VITE_RELAY_URL` = `https://seu-projeto.vercel.app`
   - Redeploy

---

### Problema: Comandos não funcionam

**Causa:** Wokwi não está verificando comandos.

**Verificação:**
1. Abra Serial Monitor no Wokwi
2. Clique em botões na interface
3. Deve aparecer: `→ Command: MASTER ON`

Se NÃO aparecer:
- Verifique console do navegador (F12)
- Verifique se `COMMAND_ENDPOINT` está correto
- Teste manualmente: `POST https://seu-projeto.vercel.app/api/websocket-relay/command`

---

### Problema: "CORS error"

**Causa:** Vercel bloqueando requisições.

**Solução:**
O código já inclui headers CORS. Se persistir:

1. Adicione em `vercel.json`:
   ```json
   {
     "headers": [
       {
         "source": "/api/(.*)",
         "headers": [
           { "key": "Access-Control-Allow-Origin", "value": "*" },
           { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
           { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
         ]
       }
     ]
   }
   ```

---

## 📊 Endpoints da API

### GET `/api/websocket-relay/status`
Retorna status do relay e conexão Wokwi.

**Response:**
```json
{
  "clients": 2,
  "wokwiConnected": true,
  "lastUpdate": 1704723456789,
  "hasPendingCommand": false
}
```

---

### GET `/api/websocket-relay/stream`
SSE endpoint para receber dados em tempo real.

**Uso:**
```javascript
const eventSource = new EventSource('/api/websocket-relay/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data); // { bat: 80, fue: 100, thr: 50, ... }
};
```

---

### POST `/api/websocket-relay/wokwi`
Wokwi envia dados para este endpoint.

**Body:**
```json
{
  "mas": 1,
  "bat": 80.0,
  "fue": 100.0,
  "thr": 50,
  "tst": 2500,
  ...
}
```

---

### POST `/api/websocket-relay/command`
Interface envia comandos para Wokwi.

**Body:**
```json
{
  "command": {
    "type": "MASTER_ON",
    "value": null,
    "timestamp": 1704723456789
  }
}
```

---

### GET `/api/websocket-relay/command`
Wokwi verifica comandos pendentes.

**Response:**
```json
{
  "command": {
    "type": "THROTTLE",
    "value": 50
  },
  "timestamp": 1704723456789
}
```

---

## 🎯 Resumo do Fluxo

```
1. Interface Web → Usuário clica "MASTER POWER"
   ↓
2. Interface → POST /api/websocket-relay/command
   ↓
3. Wokwi (poll) → GET /api/websocket-relay/command
   ↓
4. Wokwi executa comando → Liga master power
   ↓
5. Wokwi → POST /api/websocket-relay/wokwi (envia dados)
   ↓
6. Relay → Broadcast via SSE para Interface
   ↓
7. Interface → Atualiza gráficos em tempo real! ✅
```

---

## ✅ Checklist de Configuração

- [ ] Relay server deployado no Vercel
- [ ] Endpoint `/api/websocket-relay/status` acessível
- [ ] Código Wokwi atualizado com URL correta
- [ ] Biblioteca ArduinoJson instalada no Wokwi
- [ ] Wokwi rodando (Play ▶️ clicado)
- [ ] Serial Monitor mostra "WiFi connected"
- [ ] Serial Monitor mostra "Data sent"
- [ ] Status endpoint mostra `wokwiConnected: true`
- [ ] Interface Web conecta (HW Link verde)
- [ ] Controles funcionam (comandos aparecem no Serial)
- [ ] Dados aparecem em tempo real na interface

---

## 📝 Notas Importantes

1. **Polling vs WebSocket:** Wokwi usa HTTP polling (200ms) em vez de WebSocket devido a limitações do Wokwi online.

2. **Latência:** Comandos têm latência de ~200-500ms (tempo de polling + rede).

3. **Limite Vercel:** Vercel Free tem limite de 100GB bandwidth/mês. Para uso intenso, considere upgrade.

4. **Persistência:** O relay NÃO persiste dados. Se Vercel redeploy, estado é resetado.

5. **Múltiplos Clientes:** Múltiplas abas da interface podem conectar simultaneamente ao mesmo Wokwi.

---

## 🚀 Próximos Passos

1. ✅ Deploy do relay server
2. ✅ Configurar Wokwi
3. ✅ Testar conexão
4. ✅ Usar em produção!

---

**🎉 Parabéns! SKYBLUE agora está 100% conectado ao Wokwi online!**
