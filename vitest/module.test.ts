// vitest/module.test.ts

/* oxlint-disable no-console */

// ESM mock of 'node:fs' and 'node:child_process'
vi.mock('node:fs', () => {
  return {
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});
const fs = await import('node:fs');

vi.mock('node:child_process', () => {
  return {
    spawnSync: vi.fn(),
  };
});
const child_process = await import('node:child_process');

type SpawnResult = ReturnType<typeof child_process.spawnSync>;
const spawnOk = {} as SpawnResult;
const spawnErr = { error: new Error('Test error') } as SpawnResult;

const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit');
});

const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

const { main } = await import('../src/module.js');

describe('mb-service main', () => {
  const originalPlatform = process.platform;
  const originalEnv = process.env;
  let mockedUid = 0;
  Object.defineProperty(process, 'getuid', { value: () => mockedUid });

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/dist/module.js'];
  });

  afterAll(() => {
    vi.restoreAllMocks();
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
      // oxlint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }).toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should mock fs.existsSync', () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => path === '/.dockerenv');

    expect(fs.existsSync('/.dockerenv')).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/.dockerenv'));

    expect(fs.existsSync('/.docker')).toBe(false);
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/.docker'));
  });

  it('should exit if not running on Linux', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command is only available on Linux systems.'));
  });

  it('should exit if running inside a container (/.dockerenv)', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return path === '/.dockerenv';
    });
    expect(fs.existsSync('/.dockerenv')).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledWith('/.dockerenv');
    vi.clearAllMocks();

    main();
    expect(fs.existsSync).toHaveBeenCalledWith('/.dockerenv');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command is not available inside a container.'));
  });

  it('should exit if running inside a container (/run/.containerenv)', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return path === '/run/.containerenv';
    });
    expect(fs.existsSync('/run/.containerenv')).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledWith('/run/.containerenv');
    vi.clearAllMocks();

    main();
    expect(fs.existsSync).toHaveBeenCalledWith('/run/.containerenv');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command is not available inside a container.'));
  });

  it('should exit if not running as root', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    mockedUid = 1000; // Simulate non-root user
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command must be run as root.'));
  });

  it('should print help if no command is given', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    mockedUid = 0; // Simulate root user
    main();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: mb-service'));
  });

  it('should call createServiceConfig', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (path === '/.dockerenv' || path === '/run/.containerenv') {
        return false;
      }
      return true;
    });
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'unknown'];

    process.env = { SUDO_USER: undefined, USER: undefined }; // Simulate no SUDO_USER or USER environment variable
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Could not determine the user to run the service.'));
    process.env = { ...originalEnv, USER: 'testuser' }; // Restore original environment

    main();

    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (path === '/.dockerenv' || path === '/run/.containerenv') {
        return false;
      }
      return false;
    });
    vi.mocked(fs.writeFileSync).mockImplementation(() => {
      throw new Error('Test error');
    });
    try {
      main();
    } catch {
      // Catch the error thrown by process.exit in createServiceConfig
    }
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to write service file:'));

    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(child_process.spawnSync).mockImplementation(() => {
      throw new Error('Test error');
    });
    try {
      main();
    } catch {
      // Catch the error thrown by process.exit in createServiceConfig
    }
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to reload systemd daemon:'));
  });

  it('should call startMatterbridgeService on "start"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'start'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call stopMatterbridgeService on "stop"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'stop'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call restartMatterbridgeService on "restart"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'restart'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call enableMatterbridgeService on "enable"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'enable'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call disableMatterbridgeService on "disable"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'disable'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should error if install command is missing package', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'install'];
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a package to install.'));
  });

  it('should call installGlobalPackage on "install <pkg>"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'install', 'testpkg@1.0.0'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should error if uninstall command is missing package', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'uninstall'];
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a package to uninstall.'));

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call uninstallGlobalPackage on "uninstall <pkg>"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'uninstall', 'testpkg@1.0.0'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should error if add command is missing plugin', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'add'];
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a plugin to add.'));
  });

  it('should call addMatterbridgePlugin on "add <plugin>"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'add', 'testplugin'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should error if remove command is missing plugin', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'remove'];
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a plugin to remove.'));
  });

  it('should call removeMatterbridgePlugin on "remove <plugin>"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'remove', 'testplugin'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call addMatterbridgePlugin on "link"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'link'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call removeMatterbridgePlugin on "unlink"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'unlink'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call showMatterbridgeLogs on "logs"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'logs'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call showMatterbridgeStatus on "status"', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', 'status'];
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    main();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
