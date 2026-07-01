// vitest/module.test.ts

/* oxlint-disable no-console */

vi.mock('node:fs', () => {
  return {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
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

const rootServicePath = '/etc/systemd/system/matterbridge.service';
const userServiceDirectory = '/home/testuser/.config/systemd/user';
const userServicePath = `${userServiceDirectory}/matterbridge.service`;

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

  /**
   * Set the mocked platform.
   *
   * @param {NodeJS.Platform} platform The platform to expose through process.platform.
   * @returns {void}
   */
  function setPlatform(platform: NodeJS.Platform): void {
    Object.defineProperty(process, 'platform', { value: platform });
  }

  /**
   * Set whether the mocked process runs as root.
   *
   * @param {boolean} root Whether process.getuid should return root.
   * @returns {void}
   */
  function setRoot(root: boolean): void {
    mockedUid = root ? 0 : 1000;
  }

  /**
   * Set the command line arguments for the command under test.
   *
   * @param {...string} args Command arguments after the executable path.
   * @returns {void}
   */
  function setCommand(...args: string[]): void {
    process.argv = ['/usr/bin/node', '/workspaces/mb-service/src/module.ts', ...args];
  }

  /**
   * Mock the service file state.
   *
   * @param {object} options Service file options.
   * @param {boolean} options.root Whether the root-owned service file exists.
   * @param {boolean} options.user Whether the user-owned service file exists.
   * @returns {void}
   */
  function mockServiceFiles(options: { root: boolean; user: boolean }): void {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (path === '/.dockerenv' || path === '/run/.containerenv') return false;
      if (path === rootServicePath) return options.root;
      if (path === userServicePath) return options.user;
      return false;
    });
  }

  /**
   * Mock the command as running inside a container.
   *
   * @param {string} containerPath The container marker path to expose.
   * @returns {void}
   */
  function mockContainer(containerPath: string): void {
    vi.mocked(fs.existsSync).mockImplementation((path) => path === containerPath);
  }

  /**
   * Enable or disable Bun runtime detection for tests.
   *
   * @param {boolean} enabled Whether process.versions.bun should be present.
   * @returns {void}
   */
  function setBun(enabled: boolean): void {
    if (enabled) {
      Object.defineProperty(process.versions, 'bun', { configurable: true, value: '1.0.0' });
      return;
    }
    Reflect.deleteProperty(process.versions, 'bun');
  }

  beforeEach(() => {
    vi.clearAllMocks();
    setPlatform(originalPlatform);
    setRoot(true);
    setBun(false);
    process.env = { ...originalEnv, HOME: '/home/testuser', USER: 'testuser' };
    setCommand();
    mockServiceFiles({ root: true, user: false });
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnOk);
    vi.mocked(fs.mkdirSync).mockImplementation(() => {});
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
  });

  afterAll(() => {
    process.env = originalEnv;
    setBun(false);
    vi.restoreAllMocks();
  });

  it('mocks console.log', () => {
    console.log('This is a test log');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('This is a test log'));
  });

  it('mocks console.error', () => {
    console.error('This is a test error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This is a test error'));
  });

  it('mocks process.exit', () => {
    expect(() => {
      // oxlint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }).toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if not running on Linux', () => {
    setPlatform('win32');

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command is only available on Linux systems.'));
  });

  it('exits if running inside a container (/.dockerenv)', () => {
    setPlatform('linux');
    mockContainer('/.dockerenv');

    main();

    expect(fs.existsSync).toHaveBeenCalledWith('/.dockerenv');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command is not available inside a container.'));
  });

  it('exits if running inside a container (/run/.containerenv)', () => {
    setPlatform('linux');
    mockContainer('/run/.containerenv');

    main();

    expect(fs.existsSync).toHaveBeenCalledWith('/run/.containerenv');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This command is not available inside a container.'));
  });

  it('exits if both service files exist', () => {
    setPlatform('linux');
    mockServiceFiles({ root: true, user: true });

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Both root-owned and user-owned Matterbridge service files exist.'));
  });

  it('exits if a non-create command runs without a service file', () => {
    setPlatform('linux');
    mockServiceFiles({ root: false, user: false });
    setCommand('start');

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Matterbridge service file does not exist.'));
  });

  it('exits if a root-owned service is managed without root on Node.js', () => {
    setPlatform('linux');
    setRoot(false);
    mockServiceFiles({ root: true, user: false });
    setCommand('start');

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('this command must be run as root'));
  });

  it('exits if a user-owned service is managed as root on Node.js', () => {
    setPlatform('linux');
    setRoot(true);
    mockServiceFiles({ root: false, user: true });
    setCommand('start');

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('must not be run as root'));
  });

  it('exits if Bun sees a system-owned service file', () => {
    setPlatform('linux');
    setBun(true);
    mockServiceFiles({ root: true, user: false });
    setCommand('start');

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('with bun you need a user-owned service file'));
  });

  it('prints help if no command is given and a service file exists', () => {
    setPlatform('linux');

    main();

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: mb-service'));
  });

  it('does nothing for an unknown command when preflight checks pass', () => {
    setPlatform('linux');
    setCommand('unknown');

    main();

    expect(child_process.spawnSync).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('creates a root-owned service file', () => {
    setPlatform('linux');
    setRoot(true);
    mockServiceFiles({ root: false, user: false });
    setCommand('create');

    main();

    expect(fs.writeFileSync).toHaveBeenCalledWith(rootServicePath, expect.stringContaining('WantedBy=multi-user.target'), { mode: 0o644 });
    expect(child_process.spawnSync).toHaveBeenCalledWith('systemctl', ['daemon-reload'], { stdio: 'inherit' });
  });

  it('creates a user-owned service file and its directory', () => {
    setPlatform('linux');
    setRoot(false);
    mockServiceFiles({ root: false, user: false });
    setCommand('create');

    main();

    expect(fs.mkdirSync).toHaveBeenCalledWith(userServiceDirectory, { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(userServicePath, expect.stringContaining('WantedBy=default.target'), { mode: 0o644 });
    expect(child_process.spawnSync).toHaveBeenCalledWith('systemctl', ['--user', 'daemon-reload'], { stdio: 'inherit' });
  });

  it('does not overwrite an existing service file on create', () => {
    setPlatform('linux');
    mockServiceFiles({ root: true, user: false });
    setCommand('create');

    main();

    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Service configuration already exists'));
  });

  it('errors when create cannot determine the service user', () => {
    setPlatform('linux');
    mockServiceFiles({ root: false, user: false });
    process.env = { HOME: '/home/testuser' };
    setCommand('create');

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Could not determine the user to run the service.'));
  });

  it('exits when writing the service file fails', () => {
    setPlatform('linux');
    mockServiceFiles({ root: false, user: false });
    setCommand('create');
    vi.mocked(fs.writeFileSync).mockImplementation(() => {
      throw new Error('Test error');
    });

    expect(() => {
      main();
    }).toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to write service file:'));
  });

  it('exits when reloading systemd throws', () => {
    setPlatform('linux');
    mockServiceFiles({ root: false, user: false });
    setCommand('create');
    vi.mocked(child_process.spawnSync).mockImplementation(() => {
      throw new Error('Test error');
    });

    expect(() => {
      main();
    }).toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to reload systemd daemon:'));
  });

  it('reports systemd reload errors', () => {
    setPlatform('linux');
    mockServiceFiles({ root: false, user: false });
    setCommand('create');
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to reload systemd daemon:', 'Test error');
  });

  it.each([
    ['start', ['start', 'matterbridge'], 'Failed to start matterbridge service:'],
    ['stop', ['stop', 'matterbridge'], 'Failed to stop matterbridge service:'],
    ['restart', ['restart', 'matterbridge'], 'Failed to restart matterbridge service:'],
    ['enable', ['enable', 'matterbridge'], 'Failed to enable matterbridge service:'],
    ['disable', ['disable', 'matterbridge'], 'Failed to disable matterbridge service:'],
    ['status', ['status', 'matterbridge', '--no-pager'], 'Failed to get status:'],
  ])('runs systemctl %s for a root-owned service', (command, args, errorMessage) => {
    setPlatform('linux');
    setRoot(true);
    mockServiceFiles({ root: true, user: false });
    setCommand(command);

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('systemctl', args, { stdio: 'inherit' });

    vi.clearAllMocks();
    mockServiceFiles({ root: true, user: false });
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(errorMessage, 'Test error');
  });

  it.each([
    ['start', ['--user', 'start', 'matterbridge'], 'Failed to start matterbridge service:'],
    ['stop', ['--user', 'stop', 'matterbridge'], 'Failed to stop matterbridge service:'],
    ['restart', ['--user', 'restart', 'matterbridge'], 'Failed to restart matterbridge service:'],
    ['enable', ['--user', 'enable', 'matterbridge'], 'Failed to enable matterbridge service:'],
    ['disable', ['--user', 'disable', 'matterbridge'], 'Failed to disable matterbridge service:'],
    ['status', ['--user', 'status', 'matterbridge', '--no-pager'], 'Failed to get status:'],
  ])('runs systemctl %s for a user-owned service', (command, args, errorMessage) => {
    setPlatform('linux');
    setRoot(false);
    mockServiceFiles({ root: false, user: true });
    setCommand(command);

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('systemctl', args, { stdio: 'inherit' });

    vi.clearAllMocks();
    setRoot(false);
    mockServiceFiles({ root: false, user: true });
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);
    main();
    expect(consoleErrorSpy).toHaveBeenCalledWith(errorMessage, 'Test error');
  });

  it('shows root-owned service logs', () => {
    setPlatform('linux');
    setRoot(true);
    setCommand('logs');

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('journalctl', ['-u', 'matterbridge.service', '-n', '1000', '-f', '--output', 'cat'], { stdio: 'inherit' });
  });

  it('shows user-owned service logs', () => {
    setPlatform('linux');
    setRoot(false);
    mockServiceFiles({ root: false, user: true });
    setCommand('logs');

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('journalctl', ['--user', '-u', 'matterbridge.service', '-n', '1000', '-f', '--output', 'cat'], { stdio: 'inherit' });
  });

  it('reports log command errors', () => {
    setPlatform('linux');
    setCommand('logs');
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to show logs:', 'Test error');
  });

  it('requires a package for install', () => {
    setPlatform('linux');
    setCommand('install');

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a package to install.'));
  });

  it('installs a global npm package as root on Node.js', () => {
    setPlatform('linux');
    setCommand('install', 'testpkg@1.0.0');

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('npm', ['install', 'testpkg@1.0.0', '--global', '--omit=dev', '--verbose'], { stdio: 'inherit' });
  });

  it('does not install a global npm package without root on Node.js', () => {
    setPlatform('linux');
    setRoot(false);
    mockServiceFiles({ root: false, user: true });
    setCommand('install', 'testpkg@1.0.0');

    main();

    expect(child_process.spawnSync).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Installing global packages requires root privileges.'));
  });

  it('installs a global package with Bun', () => {
    setPlatform('linux');
    setBun(true);
    setRoot(false);
    mockServiceFiles({ root: false, user: true });
    setCommand('install', 'testpkg@1.0.0');

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('bun', ['add', 'testpkg@1.0.0', '--global'], { stdio: 'inherit' });
  });

  it('reports install command errors', () => {
    setPlatform('linux');
    setCommand('install', 'testpkg@1.0.0');
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to install testpkg@1.0.0:', 'Test error');
  });

  it('requires a package for uninstall', () => {
    setPlatform('linux');
    setCommand('uninstall');

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a package to uninstall.'));
  });

  it('uninstalls a global npm package as root on Node.js', () => {
    setPlatform('linux');
    setCommand('uninstall', 'testpkg@1.0.0');

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('npm', ['uninstall', 'testpkg@1.0.0', '--global', '--verbose'], { stdio: 'inherit' });
  });

  it('does not uninstall a global npm package without root on Node.js', () => {
    setPlatform('linux');
    setRoot(false);
    mockServiceFiles({ root: false, user: true });
    setCommand('uninstall', 'testpkg@1.0.0');

    main();

    expect(child_process.spawnSync).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Uninstalling global packages requires root privileges.'));
  });

  it('uninstalls a global package with Bun', () => {
    setPlatform('linux');
    setBun(true);
    setRoot(false);
    mockServiceFiles({ root: false, user: true });
    setCommand('uninstall', 'testpkg@1.0.0');

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('bun', ['remove', 'testpkg@1.0.0', '--global'], { stdio: 'inherit' });
  });

  it('reports uninstall command errors', () => {
    setPlatform('linux');
    setCommand('uninstall', 'testpkg@1.0.0');
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to uninstall testpkg@1.0.0:', 'Test error');
  });

  it('requires a plugin for add', () => {
    setPlatform('linux');
    setCommand('add');

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a plugin to add.'));
  });

  it('adds a Matterbridge plugin', () => {
    setPlatform('linux');
    setCommand('add', 'testplugin');

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('matterbridge', ['-add', 'testplugin'], { stdio: 'inherit' });
  });

  it('reports add command errors', () => {
    setPlatform('linux');
    setCommand('add', 'testplugin');
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to add plugin testplugin:', 'Test error');
  });

  it('requires a plugin for remove', () => {
    setPlatform('linux');
    setCommand('remove');

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify a plugin to remove.'));
  });

  it('removes a Matterbridge plugin', () => {
    setPlatform('linux');
    setCommand('remove', 'testplugin');

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('matterbridge', ['-remove', 'testplugin'], { stdio: 'inherit' });
  });

  it('reports remove command errors', () => {
    setPlatform('linux');
    setCommand('remove', 'testplugin');
    vi.mocked(child_process.spawnSync).mockReturnValue(spawnErr);

    main();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to remove plugin testplugin:', 'Test error');
  });

  it('links the current directory as a Matterbridge plugin', () => {
    setPlatform('linux');
    setCommand('link');

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('matterbridge', ['-add', './'], { stdio: 'inherit' });
  });

  it('unlinks the current directory as a Matterbridge plugin', () => {
    setPlatform('linux');
    setCommand('unlink');

    main();

    expect(child_process.spawnSync).toHaveBeenCalledWith('matterbridge', ['-remove', './'], { stdio: 'inherit' });
  });
});
