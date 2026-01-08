# ✅ SKYBLUE v1.0 - Integration Checklist

## Garantia de Integração Perfeita

Este checklist garante que a interface Vercel e o modelo Wokwi estejam 100% conectados e integrados.

---

## 📋 PRÉ-DEPLOYMENT

### 1. Código Arduino (.ino)

- [ ] Arquivo: `skyblue-hybrid-engine.ino` está no projeto
- [ ] Linha 20: `RELAY_SERVER` URL configurada
- [ ] Envia **todos os 32 parâmetros** de telemetria
- [ ] Processa **todos os comandos** (MASTER, ICE, THROTTLE, MODE, EMERGENCY)
- [ ] Biblioteca ArduinoJson incluída no Wokwi

**Parâmetros verificados:**
```cpp
✓ mas, ice, mot, mod          (status flags)
✓ bat, fue, thr, sol, tst     (valores básicos)
✓ flt_time, dist_km, range_km (métricas de voo)
✓ elec_wh, ice_wh, solar_wh   (energia)
✓ elec_pct                    (ratio elétrico)
✓ co2_g, nox_g, co_g, hc_g    (emissões)
✓ fuel_l                      (combustível consumido)
✓ co2_saved_g, nox_saved_g    (emissões economizadas)
✓ co_saved_g, hc_saved_g
✓ fuel_saved_l                (combustível economizado)
✓ conv_co2_g, conv_fuel_l     (convencional)
✓ co2_reduction_pct           (% redução CO2)
✓ fuel_reduction_pct          (% redução combustível)
```

### 2. Relay Server (Vercel)

- [ ] Arquivo: `/api/websocket-relay.js` existe
- [ ] Endpoints configurados:
  - [ ] `GET /api/websocket-relay/status`
  - [ ] `GET /api/websocket-relay/stream` (SSE)
  - [ ] `POST /api/websocket-relay/wokwi` (recebe dados)
  - [ ] `GET /api/websocket-relay/command` (Wokwi busca)
  - [ ] `POST /api/websocket-relay/command` (interface envia)
- [ ] CORS headers configurados
- [ ] Vercel deployment successful

### 3. Interface Web (React)

- [ ] Hook: `useWebSocketConnection.js` usa SSE
- [ ] Botão "Connect Wokwi" visível (ícone Cloud)
- [ ] Estados: Disconnected / Connected / Error
- [ ] Alertas em inglês e claros
- [ ] Help Modal atualizado com arquitetura Cloud
- [ ] Charts recebem dados do hook

### 4. Documentação

- [ ] `README.md` atualizado com arquitetura Cloud
- [ ] `WOKWI_RELAY_SETUP.md` completo
- [ ] `CHANGELOG.md` criado
- [ ] `.env.example` existe
- [ ] `HelpModal.jsx` documenta conexão

---

## 🚀 DEPLOYMENT

### Deploy no Vercel

```bash
# 1. Commit
git add .
git commit -m "v1.0.0: Cloud Connected Integration"
git push origin main

# 2. Vercel auto-deploy
# Aguardar: https://vercel.com/dashboard
```

**Verificações pós-deploy:**

- [ ] Build bem-sucedido
- [ ] Sem erros de linting
- [ ] `/api/websocket-relay/status` acessível
- [ ] Interface carrega sem erros (F12 console limpo)

---

## 🔗 INTEGRAÇÃO WOKWI ↔ VERCEL

### Setup Wokwi

1. **Abrir Projeto**
   - [ ] Ir para: https://wokwi.com/projects/452473775385515009
   - [ ] Fazer fork (se não for seu projeto)

2. **Configurar Código**
   - [ ] Colar código de `skyblue-hybrid-engine.ino`
   - [ ] Editar linha 20: `const char* RELAY_SERVER = "https://SEU-DOMINIO.vercel.app";`
   - [ ] **IMPORTANTE:** Usar SEU domínio Vercel!

3. **Instalar Dependências**
   - [ ] Library Manager → Procurar "ArduinoJson"
   - [ ] Instalar "ArduinoJson by Benoit Blanchon" (v6.x)

4. **Testar Conexão**
   - [ ] Clicar Play ▶️
   - [ ] Serial Monitor mostra:
     ```
     SKYBLUE Hybrid Engine v1.0
     Cloud-Connected Edition
     Connecting to WiFi...
     ✓ WiFi connected!
     IP address: 192.168.1.x
     Relay server: https://seu-dominio.vercel.app
     ```
   - [ ] Após ~5 segundos:
     ```
     ✓ Data sent | Bat: 80.0% | Fuel: 100.0% | Thrust: 0N
     ```

---

## ✅ VERIFICAÇÃO DE INTEGRAÇÃO

### Teste 1: Relay Server Status

**Endpoint:** `https://seu-dominio.vercel.app/api/websocket-relay/status`

**Esperado:**
```json
{
  "clients": 0,
  "wokwiConnected": true,  ← DEVE SER TRUE
  "lastUpdate": 1704723456789,
  "hasPendingCommand": false
}
```

**❌ Se `wokwiConnected: false`:**
- Wokwi não está enviando dados
- Verificar Serial Monitor para erros
- Confirmar URL do relay está correta no .ino

---

### Teste 2: Interface → Relay Connection

1. **Abrir Interface**
   - [ ] Ir para: https://seu-dominio.vercel.app

2. **Conectar**
   - [ ] Clicar botão "Connect Wokwi" (canto superior direito)
   - [ ] Botão muda para "Wokwi Connected" (verde)
   - [ ] Ícone muda de `CloudOff` para `Cloud`

3. **Verificar Console (F12)**
   ```javascript
   🔌 Connecting to relay server: ...
   ✅ Connected to relay server
   📊 Relay status: {wokwiConnected: true, ...}
   📊 Data received from Wokwi: {bat: 80, fue: 100, ...}
   ```

**❌ Se não conectar:**
- Verificar console do navegador (F12)
- Confirmar `VITE_RELAY_URL` no `.env`
- Testar endpoint status manualmente

---

### Teste 3: Comandos Interface → Wokwi

1. **Na Interface Web:**
   - [ ] Clicar "MASTER POWER"
   - [ ] Mover Throttle para 50%
   - [ ] Clicar "ICE ENGINE"
   - [ ] Clicar "MODE" (ciclar modos)

2. **No Wokwi Serial Monitor:**
   ```
   → Command: MASTER ON
   → Command: THROTTLE 50%
   → Command: ICE ON
   → Command: MODE 1
   ```

**✅ Sucesso:** Comandos aparecem no Serial Monitor
**❌ Falha:** Comandos não aparecem
- Verificar endpoint `/api/websocket-relay/command`
- Testar POST manual com curl/Postman

---

### Teste 4: Dados Wokwi → Interface

1. **No Wokwi Serial Monitor:**
   ```
   ✓ Data sent | Bat: 79.5% | Fuel: 99.8% | Thrust: 2500N
   ```

2. **Na Interface Web:**
   - [ ] Battery indicator mostra ~79.5%
   - [ ] Fuel indicator mostra ~99.8%
   - [ ] Thrust chart mostra ~2500N
   - [ ] Charts atualizam em tempo real (a cada 500ms)

**✅ Sucesso:** Dados sincronizados
**❌ Falha:** Dados não atualizam
- Verificar SSE connection (F12 → Network → websocket-relay)
- Confirmar Wokwi está enviando POST

---

### Teste 5: Física do Modelo

**Verificar cálculos estão corretos:**

1. **Throttle 50% + Master ON:**
   - [ ] Thrust aumenta (~2500N)
   - [ ] Battery diminui gradualmente
   - [ ] Speed aumenta
   - [ ] Flight time incrementa

2. **Ligar ICE + Modo HYBRID:**
   - [ ] LED ICE acende no Wokwi (laranja)
   - [ ] Fuel level diminui
   - [ ] CO2 emissions aumentam
   - [ ] Thrust aumenta (electric + ICE)

3. **Solar Power:**
   - [ ] Solar chart varia (0-5 kW)
   - [ ] LED Solar pisca no Wokwi (amarelo)
   - [ ] Solar_wh incrementa

4. **Emissions Comparison:**
   - [ ] `co2_reduction_pct` > 0 (se modo não 100% ICE)
   - [ ] `fuel_reduction_pct` > 0
   - [ ] `conv_co2_g` > `co2_g`

---

### Teste 6: LEDs e Visual Feedback

**No Wokwi Diagram:**

| Ação | LED Esperado |
|------|--------------|
| Master ON + Throttle > 0 | 🟢 Motor (verde) acende |
| ICE ENGINE ON | 🟠 ICE (laranja) acende |
| Solar > 1kW | 🟡 Solar (amarelo) acende |

**Verificar:**
- [ ] LEDs correspondem ao estado da interface
- [ ] LEDs acendem/apagam sincronizados
- [ ] Cores corretas (verde/laranja/amarelo)

---

## 🎯 CHECKLIST FINAL DE INTEGRAÇÃO

### Interface ↔ Relay ↔ Wokwi

- [ ] Interface conecta ao relay via SSE
- [ ] Relay recebe dados do Wokwi via POST
- [ ] Relay envia comandos para Wokwi via GET polling
- [ ] Latência aceitável (~200-700ms)
- [ ] Sem erros no console
- [ ] Dados em tempo real fluindo

### Parâmetros

- [ ] Todos os 32 parâmetros presentes
- [ ] Valores fazem sentido fisicamente
- [ ] Cálculos de emissões corretos
- [ ] Comparação hybrid vs convencional correta

### UX/UI

- [ ] Botão "Connect Wokwi" funcional
- [ ] Estados visuais claros
- [ ] Alertas informativos
- [ ] Help Modal atualizado
- [ ] Charts responsivos

### Documentação

- [ ] README claro e completo
- [ ] Setup guide detalhado
- [ ] CHANGELOG atualizado
- [ ] .env.example presente

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Problema: "wokwiConnected: false"
**Solução:** Wokwi não está enviando dados
1. Verificar Serial Monitor mostra "✓ Data sent"
2. Confirmar URL relay está correta no .ino
3. Testar POST manual ao endpoint

### Problema: Interface não conecta
**Solução:** SSE não estabelecido
1. F12 → Network → Filtrar "websocket-relay"
2. Ver se EventSource está ativo
3. Verificar CORS headers no relay

### Problema: Comandos não funcionam
**Solução:** Polling não está funcionando
1. Wokwi deve fazer GET /command a cada 200ms
2. Ver Serial Monitor para "→ Command:"
3. Testar POST /command manualmente

### Problema: Dados dessincronizados
**Solução:** Latência ou cache
1. Refresh (Ctrl+R)
2. Verificar timestamp dos dados
3. Confirmar polling interval (200ms/500ms)

---

## ✅ TUDO FUNCIONANDO!

Quando todas as verificações passarem:

```
✓ Relay server deployado
✓ Wokwi conectado (wokwiConnected: true)
✓ Interface conecta via SSE
✓ Comandos chegam ao Wokwi
✓ Dados fluem em tempo real
✓ Charts atualizam
✓ LEDs sincronizados
✓ Física calculada corretamente
✓ Documentação completa
```

**🎉 SKYBLUE v1.0 está 100% integrado e funcional!**

---

## 📞 Suporte

- **GitHub Issues:** [Report a problem](https://github.com/daniel-marnet/skyblue-hybrid-engine/issues)
- **Documentation:** [README.md](README.md)
- **Setup Guide:** [WOKWI_RELAY_SETUP.md](WOKWI_RELAY_SETUP.md)
- **Author:** [Daniel Marnet](https://daniel.marnettech.com.br/)

---

**Última atualização:** 2026-01-08
**Versão:** 1.0.0
