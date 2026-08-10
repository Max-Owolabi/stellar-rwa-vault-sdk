import { Logger, defaultLogger, LogLevel } from '../src/utils/logger';

describe('Logger middleware with configurable log levels (Issue #62)', () => {
  let debugSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Defaults to INFO level, suppressing DEBUG', () => {
    const logger = new Logger();
    logger.debug('should not appear');
    logger.info('should appear');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  test('DEBUG level emits every severity', () => {
    const logger = new Logger({ level: 'DEBUG', timestamps: false });
    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');
    logger.error('error msg');

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  test('ERROR level suppresses DEBUG, INFO, and WARN', () => {
    const logger = new Logger({ level: 'ERROR' });
    logger.debug('nope');
    logger.info('nope');
    logger.warn('nope');
    logger.error('yes');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  test('SILENT level suppresses all output', () => {
    const logger = new Logger({ level: 'SILENT' });
    logger.debug('nope');
    logger.info('nope');
    logger.warn('nope');
    logger.error('nope');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('setLevel/getLevel update filtering at runtime', () => {
    const logger = new Logger({ level: 'WARN' });
    expect(logger.getLevel()).toBe('WARN');

    logger.info('suppressed');
    expect(infoSpy).not.toHaveBeenCalled();

    logger.setLevel('DEBUG');
    expect(logger.getLevel()).toBe('DEBUG');
    logger.info('now visible');
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  test('Includes namespace prefix in log output when provided', () => {
    const logger = new Logger({ level: 'INFO', namespace: 'vault', timestamps: false });
    logger.info('deposit processed');

    expect(infoSpy).toHaveBeenCalledWith('[INFO] [vault] deposit processed');
  });

  test('child() creates a nested namespace inheriting the parent level', () => {
    const parent = new Logger({ level: 'WARN', namespace: 'sdk', timestamps: false });
    const child = parent.child('indexer');

    child.info('suppressed by inherited WARN level');
    expect(infoSpy).not.toHaveBeenCalled();

    child.warn('visible');
    expect(warnSpy).toHaveBeenCalledWith('[WARN] [sdk:indexer] visible');
  });

  test('Passes additional metadata arguments through to console methods', () => {
    const logger = new Logger({ level: 'INFO', timestamps: false });
    const meta = { vaultId: 'v1', amount: 100n };
    logger.info('deposit', meta);

    expect(infoSpy).toHaveBeenCalledWith('[INFO] deposit', meta);
  });

  test('defaultLogger is a ready-to-use INFO-level singleton', () => {
    expect(defaultLogger).toBeInstanceOf(Logger);
    expect(defaultLogger.getLevel()).toBe('INFO');
  });

  test('All four configurable levels are valid LogLevel values', () => {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    for (const level of levels) {
      const logger = new Logger({ level });
      expect(logger.getLevel()).toBe(level);
    }
  });
});
