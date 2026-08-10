/**
 * Console logger middleware with configurable log levels (Issue #62).
 *
 * Provides a lightweight, dependency-free logger that SDK internals (and
 * consumers) can use to emit structured, level-filtered console output.
 * Levels follow the standard severity ordering:
 *   DEBUG < INFO < WARN < ERROR < SILENT
 *
 * A logger configured at a given level will only emit messages at that
 * level or higher severity. e.g. a logger set to 'WARN' will emit WARN and
 * ERROR messages, but suppress DEBUG and INFO ones.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  SILENT: 100
};

export interface LoggerOptions {
  /** Minimum level that will be emitted. Defaults to 'INFO'. */
  level?: LogLevel;
  /** Optional prefix/namespace prepended to every log line, e.g. '[vault]'. */
  namespace?: string;
  /** Include an ISO timestamp on every log line. Defaults to true. */
  timestamps?: boolean;
}

/**
 * Configurable logger middleware supporting DEBUG, INFO, WARN, and ERROR
 * severities plus a SILENT level to disable output entirely.
 */
export class Logger {
  private level: LogLevel;
  private namespace?: string;
  private timestamps: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'INFO';
    this.namespace = options.namespace;
    this.timestamps = options.timestamps ?? true;
  }

  /** Update the minimum log level at runtime. */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  /** Get the current minimum log level. */
  public getLevel(): LogLevel {
    return this.level;
  }

  public debug(message: string, ...meta: unknown[]): void {
    this.write('DEBUG', message, meta);
  }

  public info(message: string, ...meta: unknown[]): void {
    this.write('INFO', message, meta);
  }

  public warn(message: string, ...meta: unknown[]): void {
    this.write('WARN', message, meta);
  }

  public error(message: string, ...meta: unknown[]): void {
    this.write('ERROR', message, meta);
  }

  /** Returns a child logger sharing this logger's config under a nested namespace. */
  public child(namespace: string): Logger {
    const combined = this.namespace ? `${this.namespace}:${namespace}` : namespace;
    return new Logger({ level: this.level, namespace: combined, timestamps: this.timestamps });
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.level];
  }

  private write(level: LogLevel, message: string, meta: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const parts: string[] = [];
    if (this.timestamps) parts.push(new Date().toISOString());
    parts.push(`[${level}]`);
    if (this.namespace) parts.push(`[${this.namespace}]`);
    parts.push(message);

    const line = parts.join(' ');
    const consoleMethod = this.consoleMethodFor(level);
    if (meta.length > 0) {
      consoleMethod(line, ...meta);
    } else {
      consoleMethod(line);
    }
  }

  private consoleMethodFor(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case 'DEBUG':
        return console.debug ? console.debug.bind(console) : console.log.bind(console);
      case 'INFO':
        return console.info ? console.info.bind(console) : console.log.bind(console);
      case 'WARN':
        return console.warn.bind(console);
      case 'ERROR':
        return console.error.bind(console);
      default:
        return console.log.bind(console);
    }
  }
}

/** Default shared logger instance, configured at 'INFO' level. */
export const defaultLogger = new Logger();
