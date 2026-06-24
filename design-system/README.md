# OffMe Design System - Documentação Completa

## 📋 Visão Geral

O OffMe Design System é um sistema de design unificado para todas as plataformas (Web, iOS, Android) que garante consistência visual, acessibilidade e experiência do usuário em todos os dispositivos.

## 🎨 Tokens de Design

### Cores

```json
{
  "color": {
    "background": { "light": "#ffffff", "dark": "#000000" },
    "surface": { "light": "#f7f9fa", "dark": "#16181c" },
    "border": { "light": "#e1e8ed", "dark": "#2f3336" },
    "text": {
      "primary": { "light": "#0f1419", "dark": "#e7e9ea" },
      "secondary": { "light": "#536471", "dark": "#71767b" }
    },
    "accent": {
      "primary": "#1d9bf0",
      "hover": "#1a8cd8"
    }
  }
}
```

### Espaçamento (8px/12px Grid System)

```typescript
// 8px base grid
const grid8 = {
  xxs: '4px', xs: '8px', sm: '12px', md: '16px',
  lg: '24px', xl: '32px', xxl: '48px', xxxl: '64px'
};

// 12px base grid
const grid12 = {
  xxs: '6px', xs: '12px', sm: '18px', md: '24px',
  lg: '36px', xl: '48px', xxl: '72px', xxxl: '96px'
};
```

### Tipografia

```typescript
const typography = {
  display: { large: '30px', medium: '24px', small: '20px' },
  headline: { large: '18px', medium: '16px', small: '14px' },
  title: { large: '16px', medium: '14px', small: '12px' },
  body: { large: '16px', medium: '14px', small: '12px' },
  label: { large: '14px', medium: '12px', small: '10px' }
};
```

## 📦 Componentes Unificados

### Button

```tsx
import { UnifiedButton } from '@/components/ui';

<UnifiedButton
  variant="filled" // filled | outline | ghost | destructive | success
  size="md"       // sm | md | lg
  isLoading={false}
  leadingIcon={<Icon />}
  trailingIcon={<Icon />}
>
  Click Me
</UnifiedButton>
```

### Card

```tsx
import { UnifiedCard } from '@/components/ui';

<UnifiedCard
  variant="elevated" // default | elevated | interactive | bordered
  size="md"         // sm | md | lg
  isLoading={false}
>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</UnifiedCard>
```

### Badge

```tsx
import { UnifiedBadge } from '@/components/ui';

<UnifiedBadge
  variant="primary" // primary | secondary | success | warning | danger | info | subtle
  size="md"        // sm | md | lg
  isPill={true}
>
  New
</UnifiedBadge>
```

### Input

```tsx
import { UnifiedInput } from '@/components/ui';

<UnifiedInput
  variant="default" // default | error | success
  size="md"        // sm | md | lg
  leadingIcon={<SearchIcon />}
  trailingIcon={<ClearIcon />}
  placeholder="Type something..."
/>
```

## 🎯 Sistema de Grid Responsivo

### Container Classes

```typescript
const gridClasses = {
  container: 'mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8 md:py-12 lg:py-16',
  cardGrid: 'grid gap-4 sm:gap-6 md:gap-8',
  contentGrid: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
  featureGrid: 'grid gap-8 md:grid-cols-2 lg:grid-cols-3',
};
```

### Breakpoints

```typescript
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  xxl: '1536px',
};
```

## 🌓 Sistema de Tema

### Uso Básico

```tsx
import { useTheme } from '@/hooks/useTheme';

function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Tema Personalizado

```tsx
import { applyTheme } from '@/styles/design-system';

// Aplicar tema programaticamente
applyTheme('dark');

// Ou usar o hook para gerenciamento automático
const [theme, setTheme] = useTheme('system');
```

## 📱 Animações e Transições

### CSS Animations

```css
/* globals.css */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}
```

### Transições

```typescript
const transitions = {
  fast: 'transition-all duration-100ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: 'transition-all duration-200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'transition-all duration-300ms cubic-bezier(0.4, 0, 0.2, 1)',
};
```

## 🧪 Testes

### Testes Unitários (Exemplo)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedButton } from '@/components/ui';

test('renders button with correct text', () => {
  render(<UnifiedButton>Click Me</UnifiedButton>);
  expect(screen.getByText('Click Me')).toBeInTheDocument();
});

test('calls onClick handler', () => {
  const handleClick = jest.fn();
  render(<UnifiedButton onClick={handleClick}>Click Me</UnifiedButton>);
  fireEvent.click(screen.getByText('Click Me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testes de Acessibilidade

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

test('button should be accessible', async () => {
  const { container } = render(<UnifiedButton>Click Me</UnifiedButton>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 📁 Estrutura do Projeto

```
design-system/
├── tokens/
│   └── design-tokens.json      # Tokens de design compartilhados
├── web/
│   └── components/            # Componentes web específicos
├── documentation/              # Documentação detalhada
├── README.md                   # Guia principal
└── CHANGELOG.md               # Histórico de mudanças
```

## 🔧 Integração Cross-Platform

### iOS (SwiftUI)

```swift
// Exemplo de botão em SwiftUI
PrimaryButton("Title", variant: .filled, size: .medium) {
    // Ação
}
```

### Android (Jetpack Compose)

```kotlin
// Exemplo de botão em Kotlin
PrimaryButton(
    text = "Title",
    onClick = { /* Ação */ },
    variant = ButtonVariant.Filled,
    size = ButtonSize.Medium
)
```

## 🎨 Guia de Estilo

### Cores Semânticas

- **Primary**: `#1d9bf0` - Ações principais e elementos interativos
- **Success**: `#00ba7c` - Estados de sucesso e confirmações
- **Warning**: `#ffd400` - Alertas e advertências
- **Danger**: `#f91880` - Erros e ações destrutivas

### Espaçamento

Use sempre múltiplos de 8px ou 12px para consistência:
- `8px` para espaçamento interno de componentes
- `12px` para espaçamento entre componentes
- `16px` para seções e contêineres
- `24px` para seções maiores

### Tipografia

- **Display**: Títulos principais e cabeçalhos
- **Headline**: Subtítulos e seções
- **Title**: Títulos de cartões e componentes
- **Body**: Texto principal e parágrafos
- **Label**: Rótulos e texto auxiliar

## 🚀 Boas Práticas

1. **Consistência**: Sempre use os tokens de design definidos
2. **Acessibilidade**: Garanta contraste adequado e suporte a reduzido movimento
3. **Responsividade**: Teste em todos os breakpoints
4. **Performance**: Prefira CSS animations sobre JavaScript
5. **Documentação**: Mantenha a documentação atualizada

## 📚 Recursos Adicionais

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Design System Best Practices](https://www.designsystems.com/)

---

**Versão**: 2.0.0
**Última Atualização**: 24/06/2026
**Status**: Em desenvolvimento ativo