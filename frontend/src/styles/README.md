# CSS Organization

This directory contains all CSS files organized according to standard frontend practices.

## Structure

```
styles/
├── global/              # Global styles and CSS variables
│   ├── index.css       # Main global styles (resets, base elements)
│   └── variables.css   # CSS variables (colors, spacing, etc.)
├── components/          # Component-specific styles
│   └── Header.css
├── pages/               # Page-specific styles
│   ├── Home.css
│   ├── Test.css
│   └── Dashboard.css
└── App.css             # App-level layout styles
```

## Import Order

1. **Global styles** - Imported once in `main.tsx`
   ```tsx
   import './styles/global/index.css'
   ```

2. **App styles** - Imported in `App.tsx`
   ```tsx
   import './styles/App.css'
   ```

3. **Component/Page styles** - Imported in respective component files
   ```tsx
   import '../styles/components/ComponentName.css'
   import '../styles/pages/PageName.css'
   ```

## CSS Variables

All design tokens (colors, spacing, transitions) are defined in `global/variables.css`:
- **Colors**: `--primary-blue`, `--grey-*`, `--dark-*`
- **Spacing**: `--spacing-xs` through `--spacing-2xl`
- **Border Radius**: `--radius-sm` through `--radius-xl`
- **Transitions**: `--transition-fast`, `--transition-base`, `--transition-slow`

## Best Practices

1. **Use CSS Variables**: Always use variables from `variables.css` for consistency
2. **Component Isolation**: Each component has its own CSS file
3. **BEM Naming**: Use Block-Element-Modifier methodology for class names
4. **Mobile First**: Write mobile styles first, then add responsive breakpoints
5. **No Inline Styles**: Keep all styling in CSS files for maintainability
