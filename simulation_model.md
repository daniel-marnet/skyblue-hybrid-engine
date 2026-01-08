# Modelo de Simulação Realista: Motor Aeronáutico Híbrido com PV

Este documento descreve as bases físicas e as lógicas de controle utilizadas na simulação desenvolvida para o ESP32, incluindo análise ambiental completa e métricas de desempenho.

## 1. Arquitetura do Sistema
O sistema é um modelo **Híbrido Paralelo/Série**, onde a tração pode vir de um motor elétrico (alimentado por bateria/PV) ou ser complementada por um motor de combustão interna (ICE).

### Componentes:
- **Painéis Fotovoltaicos (PV):** Instalados nas superfícies das asas, gerando até 5kW em condições ideais.
- **Banco de Baterias:** 50kWh (Li-ion), servindo como reservatório central de energia.
- **Motor Elétrico (EM):** 100kW, responsável pela tração principal em modo ECO e decolagem silenciosa.
- **Motor de Combustão Interna (ICE):** 75kW, usado para range extender, recarga de bateria em voo ou potência máxima (Modo Híbrido).

## 2. Modelagem Física
### Equação de Balanço de Energia
A variação da energia na bateria ($dE/dt$) é dada por:
$$ P_{net} = P_{solar} + P_{ICE\_gen} - P_{motor} - P_{avionics} $$

Onde:
- $P_{solar} = I(t) \cdot A \cdot \eta_{pv}$ (Simulado como uma função senoidal do tempo de voo).
- $P_{motor} = \text{Throttle} \cdot P_{max\_motor}$.

### Consumo de Combustível
O consumo é proporcional à carga do ICE:
$$ \dot{m}_f = P_{ICE} \cdot SFC $$
*SFC (Specific Fuel Consumption) simulado como 0.005 L/s por kW.*

## 3. Análise Ambiental

### 3.1 Emissões Calculadas
O modelo calcula em tempo real as seguintes emissões do motor a combustão:

- **CO₂ (Dióxido de Carbono):** 2640 g/kWh - Principal gás de efeito estufa
- **NOx (Óxidos de Nitrogênio):** 12.5 g/kWh - Poluente atmosférico
- **CO (Monóxido de Carbono):** 8.3 g/kWh - Gás tóxico
- **HC (Hidrocarbonetos):** 2.1 g/kWh - Combustível não queimado

### 3.2 Comparação com Motor Convencional
A simulação calcula continuamente o que seria emitido se a aeronave usasse **apenas motor a combustão** (100% ICE) para a mesma demanda de potência. Isso permite:

- Quantificar **emissões evitadas** pelo sistema híbrido
- Calcular **percentual de redução** de CO₂ e poluentes
- Medir **economia de combustível** em litros

### 3.3 Métricas Ambientais Reportadas
- Total de CO₂, NOx, CO e HC emitidos (sistema híbrido)
- Total de combustível consumido
- Emissões que seriam geradas por motor convencional
- Emissões evitadas (diferença entre convencional e híbrido)
- Percentual de redução de emissões

## 4. Métricas de Desempenho

### 4.1 Autonomia
- **Autonomia Estimada (km):** Calculada com base na energia restante (bateria + combustível) e consumo médio
- **Tempo de Voo Restante:** Estimativa em horas baseada no perfil de consumo
- **Distância Percorrida:** Tracking em tempo real considerando velocidade de cruzeiro e throttle

### 4.2 Eficiência Energética
- **Razão Elétrica (%):** Percentual de energia fornecida pelo motor elétrico vs ICE
- **Energia Solar Coletada:** Total de energia fotovoltaica capturada (kWh)
- **Energia Elétrica Consumida:** Total usado pelo motor elétrico (kWh)
- **Energia ICE Produzida:** Total gerado pelo motor a combustão (kWh)

### 4.3 Indicadores de Performance
- **Tempo de Voo Total:** Segundos desde o início da operação
- **Empuxo Integrado:** Soma do empuxo ao longo do tempo (N·s)
- **Consumo Médio de Potência:** Watts médios consumidos durante o voo

## 5. Modos de Voo (Cockpit Controls)
1. **ELECTRIC ONLY (Modo 0):** Apenas o motor elétrico opera. Útil para taxiamento e decolagem em áreas sensíveis a ruído. Zero emissões.
2. **HYBRID (Modo 1):** Ambos os motores operam. O ICE ajuda na propulsão, reduzindo o dreno da bateria. Emissões reduzidas.
3. **CHARGING (Modo 2):** O ICE opera em ponto fixo de alta eficiência para recarregar as baterias enquanto o motor elétrico mantém o voo de cruzeiro (ou o solar auxilia).

## 6. Interface do Cockpit (ESP32)
- **Master Switch:** Habilita os sistemas aviônicos.
- **ICE Start:** Inicia a combustão (se houver combustível).
- **Throttle +/-:** Controla a demanda de potência e o passo da hélice (simulado).
- **Emergency Kill:** Desativa todos os sistemas de potência instantaneamente.

## 7. Telemetria em Tempo Real

### 7.1 Dados Básicos (a cada 500ms)
Formato JSON via Serial com todos os parâmetros operacionais e ambientais:
- Estados dos sistemas (master, ICE, motor, modo)
- Níveis de bateria e combustível
- Potência solar e empuxo
- Métricas de voo (tempo, distância, autonomia)
- Energia (elétrica, ICE, solar, razão elétrica)
- Emissões totais (CO₂, NOx, CO, HC, combustível)
- Emissões evitadas vs motor convencional
- Percentuais de redução

### 7.2 Relatório Ambiental Resumido (a cada 30s)
Relatório formatado em texto legível mostrando:
- Resumo do voo (tempo, distância)
- Emissões do motor híbrido
- Emissões que um motor convencional geraria
- Economia ambiental (CO₂, NOx, combustível)
- Percentual de redução de emissões
- Breakdown de energia por fonte

## 8. Como usar no Wokwi
1. Copie o conteúdo de `hybrid_engine.ino` para o editor de código.
2. Copie o conteúdo de `diagram.json` para a aba de diagrama.
3. Inicie a simulação.
4. Abra o Serial Monitor para ver:
   - Telemetria JSON em tempo real (a cada 500ms)
   - Relatórios ambientais resumidos (a cada 30s)

## 9. Aplicações e Análises Possíveis

Com este modelo, é possível:
- **Avaliar diferentes perfis de voo** e seu impacto ambiental
- **Comparar estratégias de operação** (mais elétrico vs mais ICE)
- **Otimizar autonomia** balanceando bateria, solar e combustível
- **Quantificar benefícios ambientais** do sistema híbrido
- **Simular cenários** de diferentes condições de voo
- **Validar viabilidade** de propulsão híbrida em aviação
