# OffMe Design System

Sistema de design unificado para todas as plataformas (Web, iOS, Android)

## Estrutura

```
design-system/
├── tokens/            # Tokens de design compartilhados
├── documentation/     # Documentação e guias
├── web/               # Implementação específica para web
├── ios/               # Implementação específica para iOS
└── android/           # Implementação específica para Android
```

## Tokens de Design

Tokens de design são os blocos fundamentais do nosso sistema visual:

- **Cores**: Paleta de cores primárias, secundárias e semânticas
- **Tipografia**: Escala tipográfica e pesos de fonte
- **Espaçamento**: Sistema de espaçamento consistente
- **Border Radius**: Arredondamento de cantos padronizado
- **Sombras**: Níveis de sombra consistentes
- **Animação**: Durações e curvas de animação

## Uso Cross-Platform

Este sistema de design foi criado para ser implementado em:

1. **Web**: React/TypeScript com CSS-in-JS
2. **iOS**: SwiftUI com Color Assets e Style Extensions
3. **Android**: Jetpack Compose com MaterialTheme

## Princípios

1. **Consistência**: Mesma experiência visual em todos os dispositivos
2. **Acessibilidade**: Seguir diretrizes WCAG AA
3. **Flexibilidade**: Suporte a temas claro/escuro e personalização
4. **Performance**: Otimizado para renderização eficiente