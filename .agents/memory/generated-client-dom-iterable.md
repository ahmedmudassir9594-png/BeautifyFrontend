---
name: Generated client DOM iterable support
description: The generated fetch client relies on Headers.entries and needs DOM iterable typings.
---

Generated API clients can use `Headers.entries()` even when the browser runtime supports it. Keep `dom.iterable` in the client library TypeScript `lib` list so workspace typechecks do not fail after codegen.

**Why:** Orval-generated request helpers typecheck against the workspace compiler settings, and the plain `dom` library does not declare the iterable methods.

**How to apply:** When regenerating the shared React client, verify `lib/api-client-react/tsconfig.json` still includes both `dom` and `dom.iterable`.