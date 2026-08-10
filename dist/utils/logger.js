"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.Logger = void 0;
const LOG_LEVEL_PRIORITY = {
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40,
    SILENT: 100
};
/**
 * Configurable logger middleware supporting DEBUG, INFO, WARN, and ERROR
 * severities plus a SILENT level to disable output entirely.
 */
class Logger {
    level;
    namespace;
    timestamps;
    constructor(options = {}) {
        this.level = options.level ?? 'INFO';
        this.namespace = options.namespace;
        this.timestamps = options.timestamps ?? true;
    }
    /** Update the minimum log level at runtime. */
    setLevel(level) {
        this.level = level;
    }
    /** Get the current minimum log level. */
    getLevel() {
        return this.level;
    }
    debug(message, ...meta) {
        this.write('DEBUG', message, meta);
    }
    info(message, ...meta) {
        this.write('INFO', message, meta);
    }
    warn(message, ...meta) {
        this.write('WARN', message, meta);
    }
    error(message, ...meta) {
        this.write('ERROR', message, meta);
    }
    /** Returns a child logger sharing this logger's config under a nested namespace. */
    child(namespace) {
        const combined = this.namespace ? `${this.namespace}:${namespace}` : namespace;
        return new Logger({ level: this.level, namespace: combined, timestamps: this.timestamps });
    }
    shouldLog(level) {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.level];
    }
    write(level, message, meta) {
        if (!this.shouldLog(level))
            return;
        const parts = [];
        if (this.timestamps)
            parts.push(new Date().toISOString());
        parts.push(`[${level}]`);
        if (this.namespace)
            parts.push(`[${this.namespace}]`);
        parts.push(message);
        const line = parts.join(' ');
        const consoleMethod = this.consoleMethodFor(level);
        if (meta.length > 0) {
            consoleMethod(line, ...meta);
        }
        else {
            consoleMethod(line);
        }
    }
    consoleMethodFor(level) {
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
exports.Logger = Logger;
/** Default shared logger instance, configured at 'INFO' level. */
exports.defaultLogger = new Logger();
