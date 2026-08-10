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
export declare class Logger {
    private level;
    private namespace?;
    private timestamps;
    constructor(options?: LoggerOptions);
    /** Update the minimum log level at runtime. */
    setLevel(level: LogLevel): void;
    /** Get the current minimum log level. */
    getLevel(): LogLevel;
    debug(message: string, ...meta: unknown[]): void;
    info(message: string, ...meta: unknown[]): void;
    warn(message: string, ...meta: unknown[]): void;
    error(message: string, ...meta: unknown[]): void;
    /** Returns a child logger sharing this logger's config under a nested namespace. */
    child(namespace: string): Logger;
    private shouldLog;
    private write;
    private consoleMethodFor;
}
/** Default shared logger instance, configured at 'INFO' level. */
export declare const defaultLogger: Logger;
