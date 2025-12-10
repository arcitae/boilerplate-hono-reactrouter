# Shared Code

This folder contains code that can be used by both frontend and backend.

## Usage

Import shared code using the alias:

```typescript
import { something } from "@shared/utils";
```

## Guidelines

- Only put code here that is safe to run in both browser and server environments
- No backend-specific code (database, file system, etc.)
- No frontend-specific code (React components, browser APIs, etc.)
- Types, utilities, constants, and validation schemas are good candidates

