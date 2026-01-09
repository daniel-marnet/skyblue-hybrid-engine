# Google Analytics Integration

Este projeto está integrado com o Google Analytics 4 (GA4) para rastreamento de eventos e análise de uso.

## Configuração

**Measurement ID:** `G-6K9LRYJBFT`

O script do Google Analytics está incluído no arquivo `index.html` e é carregado automaticamente quando a aplicação inicia.

## Uso

### Importar o utilitário de analytics

```javascript
import { 
  trackEvent, 
  trackPageView, 
  trackEngineControl,
  trackSystemStatus,
  trackInteraction,
  trackError,
  trackPerformance
} from './utils/analytics';
```

### Exemplos de uso

#### 1. Rastrear evento customizado
```javascript
trackEvent('custom_event_name', {
  parameter1: 'value1',
  parameter2: 'value2'
});
```

#### 2. Rastrear visualização de página
```javascript
trackPageView('/dashboard', 'Dashboard - SKYBLUE');
```

#### 3. Rastrear controles do motor
```javascript
// Quando o motor é iniciado
trackEngineControl('start', {
  thrust_level: 50,
  mode: 'hybrid'
});

// Quando o thrust é alterado
trackEngineControl('thrust_change', {
  old_value: 50,
  new_value: 75
});

// Quando o motor é parado
trackEngineControl('stop', {
  runtime_seconds: 120
});
```

#### 4. Rastrear status do sistema
```javascript
// Quando conectado ao ESP32
trackSystemStatus('connected', {
  device_type: 'ESP32',
  connection_time: Date.now()
});

// Quando ocorre um erro de conexão
trackSystemStatus('error', {
  error_type: 'connection_failed',
  error_message: 'Failed to connect to device'
});
```

#### 5. Rastrear interações do usuário
```javascript
// Quando um botão é clicado
trackInteraction('start_button', 'click', {
  location: 'main_panel'
});

// Quando um slider é ajustado
trackInteraction('thrust_slider', 'change', {
  value: 75
});
```

#### 6. Rastrear erros
```javascript
trackError('api_error', 'Failed to fetch data', {
  endpoint: '/api/telemetry',
  status_code: 500
});
```

#### 7. Rastrear métricas de performance
```javascript
trackPerformance('data_update_latency', 45, {
  unit: 'milliseconds',
  component: 'telemetry_display'
});
```

## Eventos Recomendados para Rastrear

### Controles do Motor
- `engine_start` - Quando o motor é iniciado
- `engine_stop` - Quando o motor é parado
- `thrust_adjustment` - Quando o thrust é ajustado
- `mode_change` - Quando o modo de operação muda (elétrico/híbrido/combustão)

### Sistema
- `connection_established` - Quando conecta ao ESP32
- `connection_lost` - Quando perde conexão
- `data_received` - Quando recebe dados de telemetria
- `command_sent` - Quando envia comando ao hardware

### Interface
- `button_click` - Cliques em botões
- `slider_change` - Mudanças em sliders
- `chart_interaction` - Interações com gráficos
- `modal_open` - Abertura de modais

### Performance
- `render_time` - Tempo de renderização de componentes
- `api_response_time` - Tempo de resposta da API
- `data_processing_time` - Tempo de processamento de dados

## Visualização de Dados

Os dados podem ser visualizados no [Google Analytics Dashboard](https://analytics.google.com/) usando o Measurement ID `G-6K9LRYJBFT`.

## Privacidade

O Google Analytics coleta dados anônimos de uso para melhorar a experiência do usuário. Nenhuma informação pessoal identificável é coletada.
