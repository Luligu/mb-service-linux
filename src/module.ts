/* eslint-disable n/no-process-exit */
/* eslint-disable no-console */
// console.warn('Loaded module.ts.');

import { existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

/**
 * Main entry point for the mb-service command.
 * It is designed to manage the Matterbridge service on Linux systems.
 * It checks if the system is running on Linux and not inside a container.
 * If the conditions are met, it prints the help screen for mb-service if no command is given.
 */
export function main() {
  // Exit if not running on Linux
  if (process.platform !== 'linux') {
    console.error('This command is only available on Linux systems. Please use the mb-service for your platform.');
    return;
  }

  // Exit if running inside a container (check for /.dockerenv or /run/.containerenv)

  if (existsSync('/.dockerenv') || existsSync('/run/.containerenv')) {
    console.error('This command is not available inside a container. Please run it on a host system.');
    return;
  }

  // Exit if not running as root
  if (process.getuid && process.getuid() !== 0) {
    console.error('This command must be run as root. Please use sudo.');
    return;
  }

  if (process.argv.length <= 2) {
    printHelp();
    return;
  }

  createServiceConfig();

  const command = process.argv[2];
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
function printHelp() {
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
      `    status                           check if matterbridge is running\n`,
  );
}

/**
 * Create the systemd service configuration for Matterbridge.
 */
function createServiceConfig() {
  const user = process.env.SUDO_USER || process.env.USER;
  const config = `[Unit]\nDescription=matterbridge\nAfter=network-online.target\n\n[Service]\nType=simple\nExecStart=matterbridge -service\nWorkingDirectory=~\nStandardOutput=inherit\nStandardError=inherit\nRestart=always\nUser=${user}\nGroup=${user}\n\n[Install]\nWantedBy=multi-user.target\n`;
  const servicePath = `/etc/systemd/system/matterbridge.service`;

  if (!user) {
    console.error('Could not determine the user to run the service. Please set SUDO_USER or USER environment variable.');
    return;
  }
  if (existsSync(servicePath)) {
    // console.debug(`Service configuration already exists at ${servicePath}. No changes made.`);
    return;
  }
  try {
    writeFileSync(servicePath, config, { mode: 0o644 });
    console.log(`Service configuration written to ${servicePath} successfully for user ${user}.`);
  } catch (err) {
    console.error(`Failed to write service file: ${err}`);
    process.exit(1);
  }
  try {
    const reload = spawnSync('systemctl', ['daemon-reload'], { stdio: 'inherit' });
    if (reload.error) {
      console.error('Failed to reload systemd daemon:', reload.error.message);
    } else {
      console.log('Systemd daemon reloaded successfully.');
    }
  } catch (err) {
    console.error(`Failed to reload systemd daemon: ${err}`);
    process.exit(1);
  }
}

/**
 * Start the matterbridge service using systemctl.
 */
function startMatterbridgeService() {
  const result = spawnSync('systemctl', ['start', 'matterbridge'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to start matterbridge service:', result.error.message);
  }
}

/**
 * Stop the matterbridge service using systemctl.
 */
function stopMatterbridgeService() {
  const result = spawnSync('systemctl', ['stop', 'matterbridge'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to stop matterbridge service:', result.error.message);
  }
}

/**
 * Restart the matterbridge service using systemctl.
 */
function restartMatterbridgeService() {
  const result = spawnSync('systemctl', ['restart', 'matterbridge'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to restart matterbridge service:', result.error.message);
  }
}

/**
 * Enable the matterbridge service using systemctl.
 */
function enableMatterbridgeService() {
  const result = spawnSync('systemctl', ['enable', 'matterbridge'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to enable matterbridge service:', result.error.message);
  }
}

/**
 * Disable the matterbridge service using systemctl.
 */
function disableMatterbridgeService() {
  const result = spawnSync('systemctl', ['disable', 'matterbridge'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to disable matterbridge service:', result.error.message);
  }
}

/**
 * Install a global npm package (plugin) for Matterbridge.
 *
 * @param {string} pkg - The npm package name (and optional version) to install globally.
 */
function installGlobalPackage(pkg: string) {
  const result = spawnSync('npm', ['install', pkg, '--global', '--omit=dev', '--verbose'], { stdio: 'inherit' });
  if (result.error) {
    console.error(`Failed to install ${pkg}:`, result.error.message);
  }
}

/**
 * Uninstall a global npm package (plugin) for Matterbridge.
 *
 * @param {string} pkg - The npm package name (and optional version) to uninstall globally.
 */
function uninstallGlobalPackage(pkg: string) {
  const result = spawnSync('npm', ['uninstall', pkg, '--global', '--verbose'], { stdio: 'inherit' });
  if (result.error) {
    console.error(`Failed to uninstall ${pkg}:`, result.error.message);
  }
}

/**
 * Add a plugin to Matterbridge using 'matterbridge -add PLUGIN'.
 *
 * @param {string} plugin - The plugin name to add.
 */
function addMatterbridgePlugin(plugin: string) {
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
function removeMatterbridgePlugin(plugin: string) {
  const result = spawnSync('matterbridge', ['-remove', plugin], { stdio: 'inherit' });
  if (result.error) {
    console.error(`Failed to remove plugin ${plugin}:`, result.error.message);
  }
}

/**
 * Show the last 1000 lines of the Matterbridge service logs and follow new logs.
 */
function showMatterbridgeLogs() {
  const result = spawnSync('journalctl', ['-u', 'matterbridge.service', '-n', '1000', '-f', '--output', 'cat'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to show logs:', result.error.message);
  }
}

/**
 * Show the status of the Matterbridge service using systemctl.
 */
function showMatterbridgeStatus() {
  const result = spawnSync('systemctl', ['status', 'matterbridge', '--no-pager'], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to get status:', result.error.message);
  }
}

main();
