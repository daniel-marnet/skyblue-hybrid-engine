# 🎨 SKYBLUE - Diagram Wokwi Completo

## 📋 Componentes do Diagram

### **ESP32 DevKit V1**
- Microcontrolador principal
- WiFi integrado
- WebSocket server

### **3 LEDs Indicadores** 💡
1. **LED Verde (MOTOR)** - Pin 2
   - Acende quando motor elétrico está ligado
   - Resistor 220Ω

2. **LED Laranja (ICE)** - Pin 15
   - Acende quando motor a combustão está ligado
   - Resistor 220Ω

3. **LED Amarelo (SOLAR)** - Pin 13
   - Acende quando painéis solares estão gerando > 500W
   - Resistor 220Ω

### **6 Botões de Controle** 🎮

1. **MASTER (Verde)** - Pin 4
   - Liga/desliga sistema principal
   - Deve estar ON para outros controles funcionarem

2. **START (Azul)** - Pin 5
   - Botão de inicialização
   - Reservado para expansões futuras

3. **MODE (Cyan)** - Pin 18
   - Alterna entre modos:
     - ELECTRIC (0)
     - HYBRID (1)
     - CHARGING (2)

4. **THR+ (Branco)** - Pin 19
   - Aumenta throttle
   - Incrementa potência do motor

5. **THR- (Branco)** - Pin 21
   - Diminui throttle
   - Reduz potência do motor

6. **KILL (Vermelho)** - Pin 22
   - Emergência
   - Desliga tudo imediatamente

---

## 🔌 Mapeamento de Pinos

### **Saídas (LEDs):**
```
Pin 2  → LED Motor (Verde)
Pin 15 → LED ICE (Laranja)
Pin 13 → LED Solar (Amarelo)
```

### **Entradas (Botões):**
```
Pin 4  → MASTER (Verde)
Pin 5  → START (Azul)
Pin 18 → MODE (Cyan)
Pin 19 → THR+ (Branco)
Pin 21 → THR- (Branco)
Pin 22 → KILL (Vermelho)
```

### **Comunicação:**
```
TX0 → Serial Monitor
RX0 → Serial Monitor
```

---

## 🚀 Como Usar no Wokwi

### **Método 1: Projeto Novo**

1. **Criar Projeto:**
   ```
   Wokwi → New Project → ESP32
   ```

2. **Adicionar Código:**
   - Copiar `skyblue-hybrid-engine.ino`
   - Colar no editor

3. **Adicionar Diagram:**
   - Clicar na aba **"diagram.json"**
   - Copiar conteúdo de `diagram.json`
   - Colar

4. **Instalar Biblioteca:**
   - Library Manager → "WebSockets"
   - Instalar "WebSockets by Markus Sattler"

5. **Rodar:**
   - Play ▶️

### **Método 2: Projeto Pronto**

Usar o projeto já configurado:
👉 https://wokwi.com/projects/452473775385515009

---

## 🎮 Interação com o Diagram

### **LEDs Indicadores:**

Quando você controla pela interface web:

- **Master Power ON** → Nenhum LED (sistema pronto)
- **Throttle > 0** → LED Verde acende (motor ligado)
- **ICE Engine ON** → LED Laranja acende
- **Solar > 500W** → LED Amarelo acende

### **Botões Físicos (Opcional):**

Você pode clicar nos botões no Wokwi:

1. **MASTER** → Liga sistema
2. **MODE** → Alterna modo
3. **THR+** → Aumenta potência
4. **THR-** → Diminui potência
5. **KILL** → Emergência

**Mas é mais fácil usar a interface web!** 😊

---

## 📊 Layout Visual

```
        ┌─────────────────────────────────┐
        │         ESP32 DevKit V1         │
        └─────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
     [LED 💚]      [LED 🟠]      [LED 🟡]
     MOTOR         ICE          SOLAR
     Pin 2         Pin 15       Pin 13


  [🟢 MASTER]  [🔵 START]  [🔷 MODE]
    Pin 4        Pin 5       Pin 18

  [⚪ THR+]    [⚪ THR-]    [🔴 KILL]
    Pin 19       Pin 21      Pin 22
```

---

## ✅ Vantagens do Diagram

### **Com Diagram:**
- ✅ Visualização dos LEDs
- ✅ Botões clicáveis no Wokwi
- ✅ Feedback visual imediato
- ✅ Mais realista
- ✅ Bom para demonstrações

### **Sem Diagram:**
- ✅ Mais simples
- ✅ Menos configuração
- ✅ Funciona igual (via interface web)
- ✅ Mais rápido para começar

---

## 🎯 Recomendação

**Use o diagram se:**
- Quer ver LEDs piscando
- Quer demonstrar para outras pessoas
- Gosta de visual completo
- Quer testar botões físicos

**Não use o diagram se:**
- Quer começar rápido
- Só vai usar a interface web
- Prefere simplicidade

---

## 📝 Arquivos Necessários

### **Para Wokwi Completo:**
1. `hybrid_engine_websocket.ino` - Código ESP32
2. `diagram.json` - Este arquivo (layout visual)
3. Biblioteca: WebSockets by Markus Sattler

### **Para Interface Web:**
1. Código rodando no Wokwi
2. Interface: http://localhost:5173 ou https://skyblue-hybrid-engine.vercel.app
3. Clicar "HW Link"

---

## 🔧 Customização

Quer mudar o layout? Edite `diagram.json`:

### **Mudar posição de componente:**
```json
{
  "type": "wokwi-led",
  "top": -76.8,   // ← Posição vertical
  "left": 105.6,  // ← Posição horizontal
}
```

### **Mudar cor de LED:**
```json
{
  "attrs": { "color": "blue" }  // red, green, blue, yellow, orange
}
```

### **Mudar cor de botão:**
```json
{
  "attrs": { "color": "purple" }  // green, blue, red, white, etc.
}
```

---

## 🎉 Pronto!

Agora você tem um **diagram completo e profissional** para o Wokwi!

**Próximos passos:**
1. Copiar `diagram.json` para o Wokwi
2. Copiar `hybrid_engine_websocket.ino`
3. Instalar biblioteca WebSockets
4. Play ▶️
5. Conectar interface
6. Ver LEDs piscando! 💡

---

**SKYBLUE v6.0 - Complete Wokwi Integration**  
*Desenvolvido por Daniel Marnet*
