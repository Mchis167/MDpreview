# ADR: Systems-Based Semantic Token Refactor

## Status
Accepted

## Context
The previous semantic token system used generic alpha-based tokens like `--ds-hover-sm`, `--ds-hover-md`, and `--ds-hover-lg`. Over time, this led to confusion among developers about which token to use for specific components (e.g., Tree items using `sm` while Search palette used `md`). There was also no clear distinction between "Selected" (item focused) and "Active" (item opened) states.

## Decision
We have refactored the Tier 3 Semantic tokens in `tokens.css` to follow a **Systems-based approach**. 

### 1. Surface Systems (Static)
Defined for fixed backgrounds with specific visual contexts:
- `--ds-surface-main`: Main content area (glass).
- `--ds-surface-sidebar`: Sidebar specific glass.
- `--ds-surface-overlay`: Modals, Popovers, and Toasts.
- `--ds-surface-card`: Inner cards and sections.

### 2. Layer Systems (Interactive)
Defined by functional grouping. Each system provides a complete set of states (default, hover, selected, active):

- **Subtle System**: For low-priority navigation items (Tree View, Tabs, Ghost Buttons).
- **Subtle Dark System**: For dark/high-contrast navigation items (using `black-a` variants).
- **Accent System**: For high-priority actions (Primary Buttons, Focus indicators).
- **Surface System**: For intermediate interactive surfaces (Workspace Switcher, Cards).
- **Surface Dark System**: For high-contrast or inverse interactive surfaces (using `black-a` variants).
- **Control System**: For form elements (Inputs, Textarea).
- **Danger System**: For destructive actions.

### 3. State Semantic Rules
- `hover`: Visual feedback during pointer proximity.
- `selected`: Visual feedback for multi-selection or focus within a list.
- `active`: Visual feedback for the "Current" or "Opened" state (e.g., Active File in Tree, Active Tab).

## Consequences
- **Consistency**: All components within a system now share identical interaction logic.
- **Maintainability**: Changing a system's hover behavior (e.g., Subtle) automatically updates all related components (Tree, Tabs, etc.).
- **Readability**: CSS code is more self-documenting (e.g., `background: var(--ds-layer-subtle-active)` instead of `var(--ds-hover-md)`).
- **Migration**: All existing components have been migrated, and legacy tokens have been removed to prevent future misuse.
