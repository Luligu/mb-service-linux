<!-- eslint-disable markdown/no-missing-label-refs -->

# <img src="https://matterbridge.io/assets/matterbridge.svg" alt="Matterbridge Logo" width="64px" height="64px">&nbsp;&nbsp;&nbsp;Matterbridge service cli for linux

[![npm version](https://img.shields.io/npm/v/mb-service-linux.svg)](https://www.npmjs.com/package/mb-service-linux)
[![npm downloads](https://img.shields.io/npm/dt/mb-service-linux.svg)](https://www.npmjs.com/package/mb-service-linux)
![Node.js CI](https://github.com/Luligu/mb-service-linux/actions/workflows/build.yml/badge.svg)
![CodeQL](https://github.com/Luligu/mb-service-linux/actions/workflows/codeql.yml/badge.svg)
[![codecov](https://codecov.io/gh/Luligu/mb-service-linux/branch/main/graph/badge.svg)](https://codecov.io/gh/Luligu/mb-service-linux)
[![styled with prettier](https://img.shields.io/badge/styled_with-Prettier-f8bc45.svg?logo=prettier)](https://prettier.io/)
[![linted with eslint](https://img.shields.io/badge/linted_with-ES_Lint-4B32C3.svg?logo=eslint)](https://eslint.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ESM](https://img.shields.io/badge/ESM-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![matterbridge.io](https://img.shields.io/badge/matterbridge.io-online-brightgreen)](https://matterbridge.io)

---

All notable changes to this project will be documented in this file.

If you like this project and find it useful, please consider giving it a star on [GitHub](https://github.com/Luligu/mb-service-linux) and sponsoring it.

<a href="https://www.buymeacoffee.com/luligugithub"><img src="https://matterbridge.io/assets/bmc-button.svg" alt="Buy me a coffee" width="120"></a>

## [1.0.4] - Dev branch

### Added

- [package]: Enable @typescript-eslint promise rules.

### Changed

- [package]: Update dependencies.
- [package]: Bump package to `automator` v.3.1.9.
- [package]: Bump `typescript-eslint` to v.8.59.3.
- [package]: Bump `jest` to v.30.4.2.
- [package]: Refactor `scripts`.
- [eslint]: Add `eslint` v.2.0.4 config.
- [package]: Add package script `typecheck`.
- [package]: Add Node.js 26 to package `engines` field.
- [workflows]: Add Node.js 26 to `build.yml` Node matrix and remove Node.js 20.
- [jest]: Add `jest` v.2.0.1 config.
- [agent]: Update `agent instructions`.

<a href="https://www.buymeacoffee.com/luligugithub"><img src="https://matterbridge.io/assets/bmc-button.svg" alt="Buy me a coffee" width="80"></a>

## [1.0.3] - 2025-05-01

### Changed

- [package]: Update dependencies.
- [package]: Bump package to `automator` v.3.1.7.
- [eslint]: Remove `eslint-plugin-promise` (not actively maintained) and add optional @typescript-eslint promise rules.
- [package]: Remove `overrides` that was necessary for eslint-plugin-promise.
- [package]: Bump `typescript-eslint` to v.8.59.1.
- [package]: Bump `typescript` to v.6.0.3.
- [package]: Bump `eslint` to v.10.2.1.
- [package]: Bump `typescript-eslint` to v.8.59.0.
- [eslint]: Add `eslint` v.2.0.0 config.
- [package]: Add `.vscode\tasks.json`.
- [package]: Add `.vscode\settings.json`.
- [devcontainer]: Add `Claude Code for VS Code extension` to Dev Container.
- [agent]: Add `.github\copilot-instructions.md` for copilot.
- [agent]: Add `.claude\CLAUDE.md` for claude.
- [agent]: Add agent custom instructions (`testing`) for copilot and claude.
- [eslint]: Remove `eslint-plugin-promise` (not actively maintained) and add optional @typescript-eslint promise rules.
- [package]: Remove `overrides` that was necessary for eslint-plugin-promise.
- [eslint]: Add `eslint` v.2.0.0 config.
- [prettier]: Add `prettier` v.2.0.0 config.
- [jest]: Add `jest` v.2.0.0 config.

<a href="https://www.buymeacoffee.com/luligugithub"><img src="https://matterbridge.io/assets/bmc-button.svg" alt="Buy me a coffee" width="80"></a>

## [1.0.2] - 2026-03-27

### Changed

- [package]: Update dependencies.
- [package]: Update actions versions in workflows.
- [package]: Bump package to `automator` v.3.1.4.
- [package]: Bump `typescript` to v.6.0.2.
- [package]: Bump `typescript-eslint` to v.8.57.2.
- [package]: Bump `eslint` to v.10.1.0.
- [package]: Add `type checking` script for Jest tests.
- [package]: Add `CODE_OF_CONDUCT.md`.
- [package]: Add `@eslint/json`.
- [package]: Add `@eslint/markdown`.
- [package]: Add `CONTRIBUTING.md`.
- [package]: Add `STYLEGUIDE.md`.
- [package]: Replace `eslint-plugin-import` with `eslint-plugin-simple-import-sort`.
- [devcontainer]: Update `Dev Container` configuration.
- [devcontainer]: Add `postStartCommand` to the Dev Container configuration.

<a href="https://www.buymeacoffee.com/luligugithub"><img src="https://matterbridge.io/assets/bmc-button.svg" alt="Buy me a coffee" width="80"></a>

## [1.0.1] - 2026-02-10

### Changed

- [package]: Updated dependencies.
- [package]: Updated package to Automator v. 3.0.7.
- [package]: Added cache for eslint, prettier and jest under .cache.
- [publish]: Migrated to trusted publishing / OIDC. Since you can authorize only one workflow with OIDC, publish.yml now does both the publishing with tag latest (on release) and with tag dev (on schedule or manual trigger).
- [workflows]: Updated all workflows to use Node.js 24.

<a href="https://www.buymeacoffee.com/luligugithub"><img src="https://matterbridge.io/assets/bmc-button.svg" alt="Buy me a coffee" width="80"></a>

## [1.0.0] - 2025-06-20

Initial release

<!-- Commented out section
## [1.0.0] - 2025-07-01

### Added

- [Feature 1]: Description of the feature.
- [Feature 2]: Description of the feature.

### Changed

- [Feature 3]: Description of the change.
- [Feature 4]: Description of the change.

### Deprecated

- [Feature 5]: Description of the deprecation.

### Removed

- [Feature 6]: Description of the removal.

### Fixed

- [Bug 1]: Description of the bug fix.
- [Bug 2]: Description of the bug fix.

### Security

- [Security 1]: Description of the security improvement.

<a href="https://www.buymeacoffee.com/luligugithub">
  <img src="https://matterbridge.io/assets/bmc-button.svg" alt="Buy me a coffee" width="80">
</a>

-->
