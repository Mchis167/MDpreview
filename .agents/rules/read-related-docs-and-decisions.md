---
trigger: always_on
glob: 
description: Mandates reading relevant documentation and past architectural decisions before starting any development or refactoring task.
---

# Rule: Context-First Development (Docs & Decisions)

To ensure all changes align with the product's vision and technical evolution, you MUST research and understand the existing documentation and past decisions before proposing or implementing any changes.

## Instructions:

1.  **Analyze Task Scope**: Before writing code, identify which components, modules, or features are affected by the current request.
2.  **Consult Function Docs**: Search the `docs/function-docs/` directory for any documentation related to the affected areas. Understand how the feature is intended to work from a product perspective.
3.  **Review Architectural Decisions**: Check the `docs/decisions/` directory (and its `README.md` index) for ADRs (Architectural Decision Records) that impact your task.
    *   Understand the **"Why"** behind the current implementation.
    *   Respect established patterns (e.g., Singleton UI, Centralized Settings, Unified Sidebar).
4.  **Verify Status**: Pay attention to the status of decisions (`accepted`, `superseded`, `deprecated`). Never follow patterns from superseded or deprecated decisions.
5.  **Acknowledge Context**: In your implementation plan, briefly mention the relevant documents or decisions you've consulted to show you have the necessary context.

## Goal:
Avoid "reinventing the wheel" or breaking architectural consistency by grounding every action in the project's documented history and design philosophy.
