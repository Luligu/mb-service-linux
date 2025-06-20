# <img src="matterbridge.svg" alt="Matterbridge Logo" width="64px" height="64px">&nbsp;&nbsp;&nbsp;Matterbridge service cli for linux

[![npm version](https://img.shields.io/npm/v/mb-service-linux.svg)](https://www.npmjs.com/package/mb-service-linux)
[![npm downloads](https://img.shields.io/npm/dt/mb-service-linux.svg)](https://www.npmjs.com/package/mb-service-linux)
![Node.js CI](https://github.com/Luligu/mb-service-linux/actions/workflows/build-lint-test.yml/badge.svg)
![Coverage](https://img.shields.io/badge/Jest%20coverage-100%25-brightgreen)

---

This project allow you to setup and control the service mode of Matterbridge for Linux.

If you run on macOS use [Matterbridge Service for macOS](https://www.npmjs.com/package/mb-service)

## Available Commands

Below are the main commands you can use to manage the Matterbridge service and its plugins:

| Command                        | Description                                           |
| ------------------------------ | ----------------------------------------------------- |
| `start`                        | Start the Matterbridge service                        |
| `stop`                         | Stop the Matterbridge service                         |
| `restart`                      | Restart the Matterbridge service                      |
| `enable`                       | Enable the Matterbridge service                       |
| `disable`                      | Disable the Matterbridge service                      |
| `install <plugin>@<version>`   | Install a plugin                                      |
| `uninstall <plugin>@<version>` | Uninstall a plugin                                    |
| `add <plugin>`                 | Add a plugin to Matterbridge                          |
| `remove <plugin>`              | Remove a plugin from Matterbridge                     |
| `link`                         | Add the current directory as a plugin for development |
| `unlink`                       | Remove the development link for the current directory |
| `logs`                         | Tail the Matterbridge service logs                    |
| `status`                       | Check if the Matterbridge service is running          |

These commands help you control the Matterbridge service and manage plugins efficiently.

If you like this project and find it useful, please consider giving it a star on GitHub at https://github.com/Luligu/mb-service-linux and sponsoring it.

<a href="https://www.buymeacoffee.com/luligugithub">
  <img src="bmc-button.svg" alt="Buy me a coffee" width="120">
</a>

## Prerequisites

### Matterbridge

Follow these steps to install or update Matterbridge if it is not already installed and up to date:

```
npm install -g matterbridge --omit=dev
```

on Linux od macOS you may need the necessary permissions:

```
sudo npm install -g matterbridge --omit=dev
```

See the complete guidelines on [Matterbridge](https://github.com/Luligu/matterbridge/blob/main/README.md) for more information.

## How to install the Matterbridge service cli

On windows:

```
npm install -g mb-service-linux --omit=dev
```

On linux or macOS you may need the necessary permissions:

```
sudo npm install -g mb-service-linux --omit=dev
```

Then start it from a terminal

```
mb-service
```
