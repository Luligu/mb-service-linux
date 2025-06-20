// test/module.test.ts

// console.warn('Loaded module.test.ts.');
/* eslint-disable no-console */

// ESM unstable mock of 'node:fs' and 'node:child_process'
jest.unstable_mockModule('node:fs', () => {
  // const originalModule = jest.requireActual<typeof import('node:fs')>('node:fs');
  return {
    // ...originalModule,
    // existsSync: jest.fn<typeof originalModule.existsSync>((path) => originalModule.existsSync(path)),
    // writeFileSync: jest.fn<typeof originalModule.writeFileSync>((...args) => originalModule.writeFileSync(...args)),
    existsSync: jest.fn((...args: any[]) => ({})),
    writeFileSync: jest.fn((...args: any[]) => ({})),
  };
});
const fs = await import('node:fs');

jest.unstable_mockModule('node:child_process', () => {
  // const originalModule = jest.requireActual<typeof import('node:child_process')>('node:child_process');
  return {
    // ...originalModule,
    spawnSync: jest.fn((...args: any[]) => ({})),
  };
});
const child_process = await import('node:child_process');

const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit');
});

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

import { jest } from '@jest/globals';

// console.warn('Loading ../src/module.ts');
const { main } = await import('../src/module.ts');

describe('mb-service main', () => {
  const servicePath = `/etc/systemd/system/matterbridge.service`;
  const originalPlatform = process.platform;
  const originalArgv = process.argv;
  const originalEnv = process.env;
  const originalGetuid = process.getuid;
  let mockedUid = 0;
  Object.defineProperty(process, 'getuid', { value: () => mockedUid });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts'];
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should mock console.log', () => {
    console.log('This is a test log');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('This is a test log'));
  });

  it('should mock console.error', () => {
    console.error('This is a test error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This is a test error'));
  });

  it('should mock process.exit', () => {
    expect(() => {
      // eslint-disable-next-line n/no-process-exit
      process.exit(1);
    }).toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should mock fs.existsSync', () => {
    (fs.existsSync as jest.Mock).mockImplementation((path) => path === '/.dockerenv');

    expect(fs.existsSync('/.dockerenv')).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/.dockerenv'));

    expect(fs.existsSync('/.docker')).toBe(false);
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/.docker'));
  });

  it('should exit if not running on Linux', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command is only available on Linux systems.'));
  });

  it('should exit if running inside a container (/.dockerenv)', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation((path) => {
      // console.warn(`Checking path: ${path}`);
      return path === '/.dockerenv';
    });
    expect(fs.existsSync('/.dockerenv')).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledWith('/.dockerenv');
    jest.clearAllMocks();

    main();
    expect(fs.existsSync).toHaveBeenCalledWith('/.dockerenv');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command is not available inside a container.'));
  });

  it('should exit if running inside a container (/run/.containerenv)', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation((path) => {
      // console.warn(`Checking path: ${path}`);
      return path === '/run/.containerenv';
    });
    expect(fs.existsSync('/run/.containerenv')).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledWith('/run/.containerenv');
    jest.clearAllMocks();

    main();
    expect(fs.existsSync).toHaveBeenCalledWith('/run/.containerenv');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command is not available inside a container.'));
  });

  it('should exit if not running as root', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    mockedUid = 1000; // Simulate non-root user
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command must be run as root.'));
  });

  it('should print help if no command is given', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    mockedUid = 0; // Simulate root user
    main();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: mb-service'));
  });

  it('should call createServiceConfig', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation((path) => {
      if (path === '/.dockerenv' || path === '/run/.containerenv') {
        return false;
      }
      return true;
    });
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'unknown'];

    process.env = { SUDO_USER: undefined, USER: undefined }; // Simulate no SUDO_USER or USER environment variable
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Could not determine the user to run the service.'));
    process.env = { ...originalEnv, USER: 'testuser' }; // Restore original environment

    main();
    // expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('Service configuration already exists'));

    (fs.existsSync as jest.Mock).mockImplementation((path) => {
      if (path === '/.dockerenv' || path === '/run/.containerenv') {
        return false;
      }
      return false;
    });
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Test error');
    });
    try {
      main();
    } catch (e) {
      // Catch the error thrown by process.exit in createServiceConfig
    }
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to write service file:'));

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (child_process.spawnSync as jest.Mock).mockImplementation(() => {
      throw new Error('Test error');
    });
    try {
      main();
    } catch (e) {
      // Catch the error thrown by process.exit in createServiceConfig
    }
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to reload systemd daemon:'));

    /*
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
    */
  });

  it('should call startMatterbridgeService on "start"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'start'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call stopMatterbridgeService on "stop"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'stop'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call restartMatterbridgeService on "restart"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'restart'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call enableMatterbridgeService on "enable"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'enable'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call disableMatterbridgeService on "disable"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'disable'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should error if install command is missing package', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'install'];
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a package to install.'));
  });

  it('should call installGlobalPackage on "install <pkg>"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'install', 'testpkg@1.0.0'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should error if uninstall command is missing package', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'uninstall'];
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a package to uninstall.'));

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call uninstallGlobalPackage on "uninstall <pkg>"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'uninstall', 'testpkg@1.0.0'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should error if add command is missing plugin', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'add'];
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a plugin to add.'));
  });

  it('should call addMatterbridgePlugin on "add <plugin>"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'add', 'testplugin'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should error if remove command is missing plugin', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'remove'];
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a plugin to remove.'));
  });

  it('should call removeMatterbridgePlugin on "remove <plugin>"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'remove', 'testplugin'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call addMatterbridgePlugin on "link"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'link'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call removeMatterbridgePlugin on "unlink"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'unlink'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call showMatterbridgeLogs on "logs"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'logs'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call showMatterbridgeStatus on "status"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    (fs.existsSync as jest.Mock).mockImplementation(() => false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'status'];
    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({}));
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    (child_process.spawnSync as jest.Mock).mockImplementation(() => ({ error: 'Test error' }));
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
