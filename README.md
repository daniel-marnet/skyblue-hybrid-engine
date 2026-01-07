# 🚁 SKYBLUE | Hybrid Aero Engine v5.5 - Glass Cockpit & Cloud HIL

[![React](https://img.shields.io/badge/UI-React_v18-61dafb.svg)](https://reactjs.org/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://vercel.com/)
[![Redis](https://img.shields.io/badge/Database-Redis_Cloud-red.svg)](https://redis.io/)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32_HIL-blue.svg)](https://www.espressif.com/)

O **SKYBLUE** é um ecossistema de engenharia aeroespacial de última geração para o desenvolvimento e monitoramento de motores híbridos. O sistema integra hardware real (**ESP32**), simulação de física avançada e uma interface de cockpit digital (**Glass Cockpit**) sincronizada via nuvem em tempo real.

---

## 🚀 Acesso Rápido
- **🕹️ Dashboard Digital (Live):** [https://skyblue-hybrid-engine.vercel.app](https://skyblue-hybrid-engine.vercel.app)
- **📟 Simulação Online (Wokwi):** [Wokwi Simulation Project v5](https://wokwi.com/projects/452473775385515009)
- **🔗 Portfólio do Desenvolvedor:** [Daniel Marnet Tech](https://daniel.marnettech.com.br/)

---

## 🌟 Principais Inovações (v5.5)

### ☁️ Cloud Architecture (Redis & Vercel)
Utilizando o **Redis Cloud**, o sistema permite a persistência de dados críticos de missão. O botão **"Go Cloud"** habilita a sincronização global:
- **Remote Telemetry**: Monitore o estado do motor de qualquer lugar do mundo.
- **Serverless Backend**: Processamento leve de dados via Vercel Edge Functions.

### 🕹️ Hardware-in-the-Loop (HIL)
Integração direta via **Web Serial API**, permitindo que o navegador se comunique bidirecionalmente com o ESP32.
- **Controle Direto**: Envio de comandos de ignição e throttle via hardware real.
- **Real-time Stats**: Recebimento de telemetria física JSON a 10Hz.

### ⚡ Power Trifecta (Energia Sustentável)
- **Photovoltaic Array**: Modelo de geração solar dinâmica baseado no tempo de voo.
- **High-Density Energy Storage**: Simulação de banco de baterias Li-ion de 50kWh.
- **Hybrid Range Extender**: Motor a combustão interna (ICE) para propulsão assistida e recarga.

---

## 🛠️ Stack Tecnológica
- **Frontend**: React 18 (Vite), Chart.js (Telemetry Graphs), Lucide Icons.
- **Backend API**: Node.js Serverless em Vercel Infrastructure.
- **Persistência**: ioredis conectado a Redis Cloud.
- **Firmware**: C++ Embarcado (Arduino Framework) otimizado para ESP32.

---

## 📁 Estrutura do Ecossistema
```text
├── api/                    # API Serverless para Sincronização em Nuvem
├── src/                    # UI Cockpit (React + CSS Glassmorphism)
│   ├── App.jsx             # Motor de Interface e Lógica de Física
│   └── index.css           # Design System Aeroespacial
├── hybrid_engine.ino       # Firmware do Sistema de Controle do Motor
├── diagram.json            # Configuração de Hardware Wokwi
└── simulation_model.md     # Documentação da Física Experimental
```

---

## 📄 Protocolo de Operação
1. **Ativação**: Ligue o **Master Switch** para energizar os barramentos de aviônicos.
2. **Link**: Utilize o botão **"HW Link"** para conectar o modelo físico via porta Serial.
3. **Nuvem**: Ative o **"Go Cloud"** para espelhar a telemetria no servidor Redis.
4. **Combustão**: Inicie o **ICE Ignition** se precisar de energia extra ou recarga rápida.

---
*SKYBLUE - Engineering the Future of Sustainable Aero Propulsion.*  
*Developed by **Daniel Marnet**.*
