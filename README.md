# <img src="https://matterbridge.io/assets/matterbridge.svg" alt="Matterbridge Logo" width="64px" height="64px">&nbsp;&nbsp;&nbsp;Matterbridge service cli for linux

[![npm version](https://img.shields.io/npm/v/mb-service-linux.svg)](https://www.npmjs.com/package/mb-service-linux)
[![npm downloads](https://img.shields.io/npm/dt/mb-service-linux.svg)](https://www.npmjs.com/package/mb-service-linux)
![Node.js CI](https://github.com/Luligu/mb-service-linux/actions/workflows/build.yml/badge.svg)
![CodeQL](https://github.com/Luligu/mb-service-linux/actions/workflows/codeql.yml/badge.svg)
[![codecov](https://codecov.io/gh/Luligu/mb-service-linux/branch/main/graph/badge.svg)](https://codecov.io/gh/Luligu/mb-service-linux)
[![tested with Vitest](https://img.shields.io/badge/tested_with-Vitest-6E9F18.svg?logo=vitest&logoColor=white)](https://vitest.dev)
[![styled with Oxc](https://img.shields.io/badge/styled_with-Oxc-9BE4E0.svg?logo=oxc&logoColor=white)](https://oxc.rs/docs/guide/usage/formatter.html)
[![linted with Oxc](https://img.shields.io/badge/linted_with-Oxc-9BE4E0.svg?logo=oxc&logoColor=white)](https://oxc.rs/docs/guide/usage/linter.html)
[![TypeScript Native](https://img.shields.io/badge/TypeScript_Native-3178C6?logo=typescript&logoColor=white)](https://github.com/microsoft/typescript-go)
[![ESM](https://img.shields.io/badge/ESM-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![ESM](https://img.shields.io/badge/ESM-Bun-000000?logo=bun&logoColor=white)](https://bun.com)
[![matterbridge.io](https://img.shields.io/badge/matterbridge.io-online-brightgreen)](https://matterbridge.io)

---

This project allow you to setup and control the service mode of Matterbridge for Linux.

If you run on macOS try the [Matterbridge Service for macOS](https://www.npmjs.com/package/mb-service)

## Available Commands

Below are the main commands you can use to manage the Matterbridge service and its plugins:

| Command                        | Description                                               |
| ------------------------------ | --------------------------------------------------------- |
| `start`                        | Start the Matterbridge service                            |
| `stop`                         | Stop the Matterbridge service                             |
| `restart`                      | Restart the Matterbridge service                          |
| `enable`                       | Enable the Matterbridge service                           |
| `disable`                      | Disable the Matterbridge service                          |
| `install <plugin>@<version>`   | Install a plugin                                          |
| `uninstall <plugin>@<version>` | Uninstall a plugin                                        |
| `add <plugin>`                 | Add a plugin to Matterbridge                              |
| `remove <plugin>`              | Remove a plugin from Matterbridge                         |
| `link`                         | Run `npm link` or `bun link` in the current directory     |
| `unlink`                       | Run `npm unlink` or `bun unlink` in the current directory |
| `logs`                         | Tail the Matterbridge service logs                        |
| `status`                       | Check if the Matterbridge service is running              |
| `create`                       | Create the Matterbridge service configuration             |

These commands help you control the Matterbridge service and manage plugins efficiently.

If you like this project and find it useful, please consider giving it a star on [GitHub](https://github.com/Luligu/mb-service-linux) and sponsoring it.

<a href="https://www.buymeacoffee.com/luligugithub"><img src="https://matterbridge.io/assets/bmc-button.svg" alt="Buy me a coffee" width="120"></a>

## Prerequisites

### Matterbridge

See the complete guidelines on [Matterbridge](https://matterbridge.io) for more information.

## How to install the Matterbridge service cli

Install it with Node.js:

```bash
sudo npm install matterbridge mb-service-linux --global --omit=dev
```

Or install it with Bun:

```bash
bun add matterbridge mb-service-linux --global --omit=dev
```

Create a root-owned service file when Matterbridge is installed globally with npm:

```bash
sudo mb-service create
sudo mb-service enable
sudo mb-service start
```

Create a user-owned service file when Matterbridge is installed globally with npm (no sudo required):

```bash
mb-service create
mb-service enable
mb-service start
```

When using Bun, create and manage the user-owned service without sudo (--bun is mandatory since the bin still starts with the `#!/usr/bin/env node` shebang):

```bash
bunx --bun mb-service create
bunx --bun mb-service enable
bunx --bun mb-service start
```

## Repository toolchain

> **Note:** This repository uses a new toolchain. It replaces the traditional TypeScript / ESLint / Prettier / Jest stack with a faster and lighter setup.

- **No `typescript 6.x` package** — replaced by [TypeScript Native 7.x](https://github.com/microsoft/typescript-go).
- **No ESLint, no Prettier** — replaced by the [oxc](https://oxc.rs) stack: [oxlint](https://oxc.rs/docs/guide/usage/linter.html) for linting and [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for formatting.
- **No Jest** — replaced by [Vitest](https://vitest.dev), which is much faster and natively supports ESM without extra configuration.
- **Far fewer development dependencies** — the number of installed packages drops from **~600** to **~75**. A clean install is much faster.
- **Much faster linting and formatting** — oxlint and oxfmt run in a fraction of the time required by the ESLint / Prettier pipeline.
- **Much faster builds** — tsgo compiles the project in a fraction of the time required by the standard `tsc` build.
- **Editor support** — use the VS Code extensions for tsgo and oxc to get the same experience in the editor.

## Shared agent instructions

All coding agents read the same guidance. [AGENTS.md](./AGENTS.md) and [.agents/](./.agents/) are the **single source of truth**; everything under `.github/`, `.claude/`, `.codex/` and `.antigravity/` are pointers and mirrors. Edit `.agents/` (or `AGENTS.md`), never the copies. See [.agents/README.md](./.agents/README.md) for the full layout.

| File                                           | Notes                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `AGENTS.md`                                    | Main project instructions — shared by every agent                                                            |
| `.agents/README.md`                            | Layout and versioning of the shared instructions                                                             |
| `.agents/rules/testing.instructions.md`        | Testing standards for unit tests                                                                             |
| `.agents/skills/verify-agent-context/SKILL.md` | Verify the agent loaded this context — `$verify-agent-context` (Codex), `/verify-agent-context` (all others) |

Content lives only in `.agents/`. The per-agent folders exist because each tool discovers rules and skills from its own hardcoded location, so they hold stubs that point back here — except where the tool reads `.agents/` natively.

| Tool                               | Instructions                                    | Rules                                                 | Skills                                              |
| ---------------------------------- | ----------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| Codex                              | `AGENTS.md` — read natively                     | `.agents/rules/` — linked from `AGENTS.md`, on demand | `.agents/skills/` — native, `$verify-agent-context` |
| Copilot (VS Code and coding agent) | `.github/copilot-instructions.md` → `AGENTS.md` | stubs in `.github/instructions/` — `applyTo` globs    | stub in `.github/skills/` — `/verify-agent-context` |
| Claude Code                        | `CLAUDE.md` imports `AGENTS.md`                 | stubs in `.claude/rules/` — `paths` globs             | stub in `.claude/skills/` — `/verify-agent-context` |
| Gemini / Antigravity               | `GEMINI.md` imports `AGENTS.md`                 | `.agents/rules/` — on demand                          | `.agents/skills/` — native, `/verify-agent-context` |

### Copilot instructions

| File                                                   | Notes                                        |
| ------------------------------------------------------ | -------------------------------------------- |
| `.github/copilot-instructions.md`                      | Pointer to AGENTS.md — always loaded         |
| `.github/instructions/testing/testing.instructions.md` | Testing standards — scoped to `**/*.test.ts` |
| `.github/skills/verify-agent-context/SKILL.md`         | Skill invocable as `/verify-agent-context`   |

### Claude instructions

| File                                            | Notes                                         |
| ----------------------------------------------- | --------------------------------------------- |
| `CLAUDE.md`                                     | Pointer to AGENTS.md — always loaded          |
| `.claude/settings.json`                         | Claude permissions: allow, ask and deny rules |
| `.claude/rules/testing/testing.instructions.md` | Testing standards — scoped to `**/*.test.ts`  |
| `.claude/skills/verify-agent-context/SKILL.md`  | Skill invocable as `/verify-agent-context`    |

### Codex instructions

| File                         | Notes                                                             |
| ---------------------------- | ----------------------------------------------------------------- |
| `AGENTS.md`                  | Main project instructions — read directly, no pointer file needed |
| `.codex/config.toml`         | Codex project permissions, approvals, and profile                 |
| `.codex/rules/default.rules` | Codex command allow, prompt, and deny rules                       |

Codex reads the shared rules and skills from `.agents/` directly; the skill is invoked as `$verify-agent-context`.

### Gemini / Antigravity instructions

| File                         | Notes                                                 |
| ---------------------------- | ----------------------------------------------------- |
| `GEMINI.md`                  | Pointer to AGENTS.md — always loaded                  |
| `.antigravity/settings.json` | Sandboxing and permissions: allow, ask and deny rules |

The shared rules under `.agents/rules/` apply on demand for the relevant tasks, and `.agents/skills/` is discovered automatically as `/verify-agent-context`.
