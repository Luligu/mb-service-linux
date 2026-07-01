# <img src="https://matterbridge.io/assets/matterbridge.svg" alt="Matterbridge Logo" width="64px" height="64px">&nbsp;&nbsp;&nbsp;Matterbridge service cli for linux

[![npm version](https://img.shields.io/npm/v/mb-service-linux.svg)](https://www.npmjs.com/package/mb-service-linux)
[![npm downloads](https://img.shields.io/npm/dt/mb-service-linux.svg)](https://www.npmjs.com/package/mb-service-linux)
![Node.js CI](https://github.com/Luligu/mb-service-linux/actions/workflows/build.yml/badge.svg)
![CodeQL](https://github.com/Luligu/mb-service-linux/actions/workflows/codeql.yml/badge.svg)
[![codecov](https://codecov.io/gh/Luligu/mb-service-linux/branch/main/graph/badge.svg)](https://codecov.io/gh/Luligu/mb-service-linux)
[![tested with Vitest](https://img.shields.io/badge/tested_with-Vitest-6E9F18.svg?logo=vitest&logoColor=white)](https://vitest.dev)
[![styled with Oxc](https://img.shields.io/badge/styled_with-Oxc-9BE4E0.svg?logo=oxc&logoColor=white)](https://oxc.rs/docs/guide/usage/formatter.html)
[![linted with Oxc](https://img.shields.io/badge/linted_with-Oxc-9BE4E0.svg?logo=oxc&logoColor=white)](https://oxc.rs/docs/guide/usage/linter.html)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
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
sudo npm install mb-service-linux --global --omit=dev
```

Or install it with Bun:

```bash
bun add mb-service-linux --global --omit=dev
```

Create a root-owned service file when Matterbridge is installed globally with npm:

```bash
sudo mb-service create
sudo mb-service enable
sudo mb-service start
```

Create a user-owned service file when Matterbridge is installed for the current user with npm:

```bash
mb-service create
mb-service enable
mb-service start
```

When using Bun, create and manage the user-owned service without sudo:

```bash
bunx --bun mb-service create
bunx --bun mb-service enable
bunx --bun mb-service start
```
