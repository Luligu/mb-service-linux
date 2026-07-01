/**
 * @description This file contains the main entry point for the mb-service command.
 * @file module.ts
 * @author Luca Liguori
 * @created 2024-07-14
 * @version 1.1.3
 * @license Apache-2.0
 *
 * Copyright 2024, 2025, 2026 Luca Liguori.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* oxlint-disable unicorn/no-process-exit */
/* oxlint-disable no-console */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

// Cache the detection once — the runtime can't change mid-process.
const HAS_BUN_GLOBAL = typeof Bun !== 'undefined';

/**
 * Checks if the current runtime environment is Bun.
 *
 * @returns {boolean} True if the current runtime is Bun, false otherwise.
 */
export function isBun(): boolean {
  return HAS_BUN_GLOBAL || typeof process?.versions?.bun === 'string';
}

/**
 * Checks if the current user is root.
 *
 * @returns {boolean} True if the current user is root, false otherwise.
 */
function isRoot(): boolean {
  return process.getuid?.() === 0;
}

/**
 * Checks if the current environment is a Docker container.
 *
 * @returns {boolean} True if the current environment is a Docker container, false otherwise.
 */
function isDocker(): boolean {
  return existsSync('/.dockerenv') || existsSync('/run/.containerenv');
}

/**
 * Checks if the current operating system is Linux.
 *
 * @returns {boolean} True if the current operating system is Linux, false otherwise.
 */
function isLinux(): boolean {
  return process.platform === 'linux';
}

/**
 * Gets the path to the Matterbridge service file.
 *
 * @param {boolean} root - Whether to get the path for the root user.
 * @returns {string} The path to the Matterbridge service file.
 */
function getServicePath(root: boolean): string {
  return root ? '/etc/systemd/system/matterbridge.service' : `${process.env.HOME}/.config/systemd/user/matterbridge.service`;
}

/**
 * Gets the path to the user-owned Matterbridge service file directory.
 *
 * @returns {string} The path to the user-owned Matterbridge service file directory.
 */
function getUserServiceDirectory(): string {
  return `${process.env.HOME}/.config/systemd/user`;
}

/**
 * Checks if the Matterbridge service file exists.
 *
 * @param {boolean} root - Whether to check for the root user's service file.
 * @returns {boolean} True if the service file exists, false otherwise.
 */
function existsServiceFile(root: boolean): boolean {
  return existsSync(getServicePath(root));
}

/**
 * Main entry point for the mb-service command.
 * It is designed to manage the Matterbridge service on Linux systems.
 * It checks if the system is running on Linux and not inside a container.
 * If the conditions are met, it prints the help screen for mb-service if no command is given.
 */
export function main(): void {
  const command = process.argv[2];

  // Exit if not running on Linux
  if (!isLinux()) {
    console.error('This command is only available on Linux systems. Please use the mb-service for your platform.');
    return;
  }

  // Exit if running inside a container (check for /.dockerenv or /run/.containerenv)
  if (isDocker()) {
    console.error('This command is not available inside a container. Please run it on a host system.');
    return;
  }

  // Exit if both root-owned and user-owned service files exist
  if (existsServiceFile(true) && existsServiceFile(false)) {
    console.error(
      'Both root-owned and user-owned Matterbridge service files exist. ' +
        'Please remove one of them to avoid conflicts. ' +
        'Run "sudo rm /etc/systemd/system/matterbridge.service" to remove the root-owned service file. ' +
        'Run "rm ~/.config/systemd/user/matterbridge.service" to remove the user-owned service file.',
    );
    return;
  }

  // Exit if the service file does not exist and the command is not 'create'
  if (command !== 'create' && !existsServiceFile(true) && !existsServiceFile(false)) {
    console.error(
      'Matterbridge service file does not exist. ' +
        'Run "sudo mb-service create" if you want to create a root-owned service file. ' +
        'Run "mb-service create" without sudo to create a user-owned service file.' +
        'Run "bunx mb-service create" to create a user-owned service file when using Bun.',
    );
    return;
  }

  // On Node.js exit if not running as root
  if (!isBun() && existsServiceFile(true) && !isRoot()) {
    console.error('Matterbridge service file is root-owned, this command must be run as root. Please use sudo mb-service.');
    return;
  }

  // On Node.js exit if running as root
  if (!isBun() && existsServiceFile(false) && isRoot()) {
    console.error('Matterbridge service file is user-owned, this command must not be run as root. Please use mb-service without sudo.');
    return;
  }

  // On Bun exit if the service file is system-owned and the command is not 'create'
  if (isBun() && existsServiceFile(true)) {
    console.error('Matterbridge service file is system-owned, but with bun you need a user-owned service file.');
    return;
  }

  if (process.argv.length <= 2) {
    printHelp();
    return;
  }

  if (command === 'create') {
    createServiceConfig(isRoot());
    return;
  }

  if (command === 'start') {
    startMatterbridgeService();
    return;
  }
  if (command === 'stop') {
    stopMatterbridgeService();
    return;
  }
  if (command === 'restart') {
    restartMatterbridgeService();
    return;
  }
  if (command === 'enable') {
    enableMatterbridgeService();
    return;
  }
  if (command === 'disable') {
    disableMatterbridgeService();
    return;
  }
  if (command === 'install') {
    if (!process.argv[3]) {
      console.error('Please specify a package to install.');
      return;
    }
    installGlobalPackage(process.argv[3]);
    return;
  }
  if (command === 'uninstall') {
    if (!process.argv[3]) {
      console.error('Please specify a package to uninstall.');
      return;
    }
    uninstallGlobalPackage(process.argv[3]);
    return;
  }
  if (command === 'add') {
    if (!process.argv[3]) {
      console.error('Please specify a plugin to add.');
      return;
    }
    addMatterbridgePlugin(process.argv[3]);
    return;
  }
  if (command === 'remove') {
    if (!process.argv[3]) {
      console.error('Please specify a plugin to remove.');
      return;
    }
    removeMatterbridgePlugin(process.argv[3]);
    return;
  }
  if (command === 'link') {
    addMatterbridgePlugin('./');
    return;
  }
  if (command === 'unlink') {
    removeMatterbridgePlugin('./');
    return;
  }
  if (command === 'logs') {
    showMatterbridgeLogs();
    return;
  }
  if (command === 'status') {
    showMatterbridgeStatus();
    return;
  }
}

/**
 * Prints the help screen for mb-service, similar to hb-service for Homebridge.
 */
function printHelp(): void {
  console.log(
    `Usage: mb-service [start|stop|restart|logs|status]\n\n` +
      `  Please provide a command:\n` +
      `    start                            start the matterbridge service\n` +
      `    stop                             stop the matterbridge service\n` +
      `    restart                          restart the matterbridge service\n` +
      `    enable                           enable the matterbridge service\n` +
      `    disable                          disable the matterbridge service\n` +
      `    install <plugin>@<version>       install a plugin\n` +
      `    uninstall <plugin>@<version>     uninstall a plugin\n` +
      `    add <plugin>                     add a plugin to matterbridge\n` +
      `    remove <plugin>                  remove a plugin from matterbridge\n` +
      `    link                             adds the current directory to matterbridge for plugin development\n` +
      `    unlink                           reverses the link operation for the current directory\n` +
      `    logs                             tails the matterbridge service logs\n` +
      `    status                           check if matterbridge is running\n` +
      `    create                           create the matterbridge service configuration\n`,
  );
}

/**
 * Create the systemd service configuration for Matterbridge.
 *
 * @param {boolean} root - Whether to create the service configuration for the root user or the current user.
 */
function createServiceConfig(root: boolean): void {
  // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- an empty SUDO_USER must fall through to USER
  const user = process.env.SUDO_USER || process.env.USER;
  const rootConfig =
    `[Unit]\n` +
    `Description=matterbridge\n` +
    `After=network.target\n` +
    `Wants=network.target\n` +
    `StartLimitIntervalSec=60\n` +
    `StartLimitBurst=5\n` +
    `[Service]\n` +
    `Type=simple\n` +
    `ExecStart=matterbridge --service\n` +
    `WorkingDirectory=~\n` +
    `StandardOutput=inherit\n` +
    `StandardError=inherit\n` +
    `Restart=always\n` +
    `User=${user}\n` +
    `Group=${user}\n` +
    `\n` +
    `[Install]\n` +
    `WantedBy=multi-user.target\n`;
  const userConfig =
    `[Unit]\n` +
    `Description=matterbridge\n` +
    `After=network.target\n` +
    `Wants=network.target\n` +
    `StartLimitIntervalSec=60\n` +
    `StartLimitBurst=5\n` +
    `[Service]\n` +
    `Type=simple\n` +
    `ExecStart=matterbridge --service\n` +
    `WorkingDirectory=~\n` +
    `StandardOutput=inherit\n` +
    `StandardError=inherit\n` +
    `Restart=always\n` +
    `\n` +
    `[Install]\n` +
    `WantedBy=default.target\n`;
  const servicePath = getServicePath(root);

  if (!user) {
    console.error('Could not determine the user to run the service. Please set SUDO_USER or USER environment variable.');
    return;
  }
  if (existsSync(servicePath)) {
    console.log(`Service configuration already exists at ${servicePath}. No changes made.`);
    return;
  }
  try {
    if (!root) {
      mkdirSync(getUserServiceDirectory(), { recursive: true });
    }
    writeFileSync(servicePath, root ? rootConfig : userConfig, { mode: 0o644 });
    console.log(`Service configuration written to ${servicePath} successfully for user ${user}.`);
  } catch (err) {
    console.error(`Failed to write service file: ${String(err)}`);
    process.exit(1);
  }
  try {
    const reload = spawnSync('systemctl', root ? ['daemon-reload'] : ['--user', 'daemon-reload'], { stdio: 'inherit' });
    if (reload.error) {
      console.error('Failed to reload systemd daemon:', reload.error.message);
    } else {
      console.log('Systemd daemon reloaded successfully.');
    }
  } catch (err) {
    console.error(`Failed to reload systemd daemon: ${String(err)}`);
    process.exit(1);
  }
}

/**
 * Start the matterbridge service using systemctl.
 */
function startMatterbridgeService(): void {
  const result = spawnSync('systemctl', isRoot() ? ['start', 'matterbridge'] : ['--user', 'start', 'matterbridge'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to start matterbridge service:', result.error.message);
  }
}

/**
 * Stop the matterbridge service using systemctl.
 */
function stopMatterbridgeService(): void {
  const result = spawnSync('systemctl', isRoot() ? ['stop', 'matterbridge'] : ['--user', 'stop', 'matterbridge'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to stop matterbridge service:', result.error.message);
  }
}

/**
 * Restart the matterbridge service using systemctl.
 */
function restartMatterbridgeService(): void {
  const result = spawnSync('systemctl', isRoot() ? ['restart', 'matterbridge'] : ['--user', 'restart', 'matterbridge'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to restart matterbridge service:', result.error.message);
  }
}

/**
 * Enable the matterbridge service using systemctl.
 */
function enableMatterbridgeService(): void {
  const result = spawnSync('systemctl', isRoot() ? ['enable', 'matterbridge'] : ['--user', 'enable', 'matterbridge'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to enable matterbridge service:', result.error.message);
  }
}

/**
 * Disable the matterbridge service using systemctl.
 */
function disableMatterbridgeService(): void {
  const result = spawnSync('systemctl', isRoot() ? ['disable', 'matterbridge'] : ['--user', 'disable', 'matterbridge'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to disable matterbridge service:', result.error.message);
  }
}

/**
 * Install a global npm package (plugin) for Matterbridge.
 *
 * @param {string} pkg - The npm package name (and optional version) to install globally.
 */
function installGlobalPackage(pkg: string): void {
  if (!isBun() && !isRoot()) {
    console.error('Installing global packages requires root privileges. Please run this command with sudo.');
    return;
  }
  const result = isBun()
    ? spawnSync('bun', ['add', pkg, '--global'], { stdio: 'inherit' })
    : spawnSync('npm', ['install', pkg, '--global', '--omit=dev', '--verbose'], { stdio: 'inherit' });
  if (result.error) {
    console.error(`Failed to install ${pkg}:`, result.error.message);
  }
}

/**
 * Uninstall a global npm package (plugin) for Matterbridge.
 *
 * @param {string} pkg - The npm package name (and optional version) to uninstall globally.
 */
function uninstallGlobalPackage(pkg: string): void {
  if (!isBun() && !isRoot()) {
    console.error('Uninstalling global packages requires root privileges. Please run this command with sudo.');
    return;
  }
  const result = isBun()
    ? spawnSync('bun', ['remove', pkg, '--global'], { stdio: 'inherit' })
    : spawnSync('npm', ['uninstall', pkg, '--global', '--verbose'], { stdio: 'inherit' });
  if (result.error) {
    console.error(`Failed to uninstall ${pkg}:`, result.error.message);
  }
}

/**
 * Add a plugin to Matterbridge using 'matterbridge -add PLUGIN'.
 *
 * @param {string} plugin - The plugin name to add.
 */
function addMatterbridgePlugin(plugin: string): void {
  const result = spawnSync('matterbridge', ['-add', plugin], { stdio: 'inherit' });
  if (result.error) {
    console.error(`Failed to add plugin ${plugin}:`, result.error.message);
  }
}

/**
 * Remove a plugin from Matterbridge using 'matterbridge -remove PLUGIN'.
 *
 * @param {string} plugin - The plugin name to remove.
 */
function removeMatterbridgePlugin(plugin: string): void {
  const result = spawnSync('matterbridge', ['-remove', plugin], { stdio: 'inherit' });
  if (result.error) {
    console.error(`Failed to remove plugin ${plugin}:`, result.error.message);
  }
}

/**
 * Show the last 1000 lines of the Matterbridge service logs and follow new logs.
 */
function showMatterbridgeLogs(): void {
  const result = spawnSync(
    'journalctl',
    isRoot() ? ['-u', 'matterbridge.service', '-n', '1000', '-f', '--output', 'cat'] : ['--user', '-u', 'matterbridge.service', '-n', '1000', '-f', '--output', 'cat'],
    { stdio: 'inherit' },
  );
  if (result.error) {
    console.error('Failed to show logs:', result.error.message);
  }
}

/**
 * Show the status of the Matterbridge service using systemctl.
 */
function showMatterbridgeStatus(): void {
  const result = spawnSync('systemctl', isRoot() ? ['status', 'matterbridge', '--no-pager'] : ['--user', 'status', 'matterbridge', '--no-pager'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to get status:', result.error.message);
  }
}

main();
