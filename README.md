# 🚁 SKYBLUE | Hybrid Aero Engine Simulator & Glass Cockpit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Technology: ESP32](https://img.shields.io/badge/Tech-ESP32-blue.svg)](https://www.espressif.com/en/products/socs/esp32)
[![Framework: React](https://img.shields.io/badge/Framework-React-61dafb.svg)](https://reactjs.org/)

Um ecossistema completo de simulação para motores aeronáuticos híbridos integrados com geração fotovoltaica. Este projeto combina engenharia de sistemas embarcados (ESP32) com uma interface de monitoramento de última geração (React Glass Cockpit).

---

## 🌟 Destaques

- **🕹️ Modelo Físico Realista**: Simulação de consumo de combustível, descarga de bateria e eficiência solar baseada em equações de balanço energético.
- **🔋 Sistema Híbrido Tri-Modo**: Opera em modo Elétrico Puro, Híbrido (ICE + Motor) e Modo de Carregamento em voo.
- **☀️ Integração Fotovoltaica**: Painéis solares dinâmicos que contribuem para o barramento de energia conforme a irradiância simulada.
- **🖥️ Glass Cockpit Dashboard**: Interface React inspirada em painéis de aeronaves modernas (Garmin G3000 style).
- **📟 Simulação Wokwi**: Totalmente compatível com o simulador online Wokwi para testes rápidos de hardware.

---

## 📁 Estrutura do Projeto

```text
├── hybrid_engine.ino       # Código C++ para ESP32 (Lógica do Motor)
├── diagram.json            # Configuração de hardware para o Wokwi
├── simulation_model.md     # Documentação técnica das equações de física
└── src/                    # Interface Web em React
    ├── App.jsx             # Componente Cockpit Principal
    ├── index.css           # Design System & Estética Glassmorphism
    └── main.jsx            # Entry point React
```

---

## 🛠️ Tecnologia e Física

### O Modelo de Potência
A variação de energia no banco de baterias ($dE/dt$) é calculada como:
$$ P_{net} = P_{solar} + P_{ICE} - P_{motor} $$

Onde:
- **P_solar**: Simulado como uma função senoidal do tempo de voo para representar a posição do sol.
- **P_ICE**: Potência do motor de combustão interna, podendo atuar na tração ou como gerador (Modo Range Extender).
- **P_motor**: Demanda do motor elétrico baseada na posição do manete (Throttle).

### Consumo SFC
O motor a combustão utiliza uma modelagem de consumo específico (SFC) de $0.005 L/s/kW$, permitindo simular a autonomia real da aeronave.

---

## 🚀 Como Executar

### 1. Simulação de Hardware (ESP32)
1. Acesse [Wokwi](https://wokwi.com/).
2. Crie um novo projeto **ESP32**.
3. Copie o conteúdo de `hybrid_engine.ino` para o código.
4. Copie o conteúdo de `diagram.json` para o diagrama.
5. Inicie a simulação e abra o Serial Monitor.

### 2. Interface Web (React)
1. Certifique-se de ter o **Node.js** instalado.
2. No diretório raiz, instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra o navegador no endereço indicado (geralmente `http://localhost:5173`).

---

## 🎮 Operação do Cockpit

- **Master Switch**: Ativa os sistemas aviônicos e permite o fluxo de energia.
- **ICE Start**: Inicia o motor a combustão (requer combustível disponível).
- **Throttle**: Controla o empuxo (em Newtons) e a demanda de descarga da bateria.
- **Cycle Mode**: Alterna entre propulsão exclusivamente elétrica ou suporte híbrido.
- **Emergency Kill**: Desativa instantaneamente todos os sistemas de potência.

---

## 📄 Licença
Este projeto está sob a licença MIT - consulte o arquivo [LICENSE](LICENSE) para detalhes.

---
*Desenvolvido com 💙 por SkyBlue Aerospace Team.*
