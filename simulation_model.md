# Modelo de Simulação Realista: Motor Aeronáutico Híbrido com PV

Este documento descreve as bases físicas e as lógicas de controle utilizadas na simulação desenvolvida para o ESP32.

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

## 3. Modos de Voo (Cockpit Controls)
1. **ELECTRIC ONLY:** Apenas o motor elétrico opera. Útil para taxiamento e decolagem em áreas sensíveis a ruído.
2. **HYBRID:** Ambos os motores operam. O ICE ajuda na propulsão, reduzindo o dreno da bateria.
3. **CHARGING:** O ICE opera em ponto fixo de alta eficiência para recarregar as baterias enquanto o motor elétrico mantém o voo de cruzeiro (ou o solar auxilia).

## 4. Interface do Cockpit (ESP32)
- **Master Switch:** Habilita os sistemas aviônicos.
- **ICE Start:** Inicia a combustão (se houver combustível).
- **Throttle +/-:** Controla a demanda de potência e o passo da hélice (simulado).
- **Emergency Kill:** Desativa todos os sistemas de potência instantaneamente.

## 5. Como usar no Wokwi
1. Copie o conteúdo de `hybrid_engine.ino` para o editor de código.
2. Copie o conteúdo de `diagram.json` para a aba de diagrama.
3. Inicie a simulação.
4. Abra o Serial Monitor para ver a telemetria em tempo real.
