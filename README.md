# 🚁 SKYBLUE | Hybrid Aero Engine v5.1 - Cloud & HIL Integrated

[![React](https://img.shields.io/badge/UI-React-61dafb.svg)](https://reactjs.org/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://vercel.com/)
[![Redis](https://img.shields.io/badge/Database-Redis-red.svg)](https://redis.io/)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32-blue.svg)](https://www.espressif.com/)

Um ecossistema de simulação aeroespacial de última geração para motores híbridos, integrando **Hardware-in-the-Loop (HIL)**, **Geração Solar** e **Sincronização em Nuvem em tempo real**.

---

## 🚀 Links Rápidos
- **Dashboard Live (Vercel):** [https://skyblue-hybrid-engine.vercel.app](https://skyblue-hybrid-engine.vercel.app)
- **Documentação Técnica:** [simulation_model.md](./simulation_model.md)

---

## 🌟 Novas Funcionalidades (v5.1)

### ☁️ Cloud Sync (Redis)
O sistema agora utiliza **Redis Cloud** para persistência de telemetria. Através do botão **"Go Cloud"**, o cockpit pode:
- **Transmitir**: Enviar dados do hardware real (ESP32) para a nuvem.
- **Receber**: Monitorar remotamente a atividade do motor sem conexão física.

### �️ Web Serial (HIL)
Conexão direta entre o navegador (Vercel) e o hardware real via cabo USB. Controle o motor físico diretamente pela interface web.

### ⚡ Trifecta de Energia
- **Solar PV Array**: Geração baseada em irradiância dinâmica.
- **Li-ion Battery Bank**: 50kWh com sistema de gerenciamento BMS simulado.
- **ICE Propulsion**: Motor a combustão para suporte híbrido e recarga em voo.

---

## 🛠️ Tecnologias
- **Frontend**: React 18, Vite, Tailwind-like CSS, Chart.js.
- **Backend (Serverless)**: Vercel Functions executando Node.js.
- **Database**: ioredis conectado ao Redis Cloud.
- **Firmware**: C++ embarcado para ESP32 DevKit V1.

---

## � Estrutura do Projeto
```text
├── api/                    # Serverless Functions (Redis Sync)
├── src/                    # Interface React (Glass Cockpit)
├── hybrid_engine.ino       # Firmware Embarcado
└── diagram.json            # Mock de Hardware (Wokwi)
```

---

## 📄 Operação
1. **Ative o Master Switch**: Habilita os barramentos de energia.
2. **Conecte o Hardware**: Use o botão superior "Hardware" para link Serial.
3. **Ative o Cloud Sync**: Sincronize seus dados globais.
4. **Gerencie o Throttle**: Controle o empuxo e monitore o balanço energético.

---
*SKYBLUE AEROSPACE - Engineering the Future of Sustainable Flight.*

