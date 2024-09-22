const LOGGER_ENABLED = true;

export class Logger {
  private readonly source: string;

  constructor(source: string) {
    this.source = source;
  }

  log<T>(message: string, metadata?: T, raw = false): this {
    if (!LOGGER_ENABLED) return this;
    raw
      ? console.log(message, metadata)
      : console.log('VERBOSE -->', message, {
          source: this.source,
          data: metadata,
          time: new Date(Date.now()),
        });
    return this;
  }

  info<T>(message: string, metadata?: T): this {
    if (!LOGGER_ENABLED) return this;
    console.info('INFO -->', message, {
      source: this.source,
      data: metadata,
    });
    return this;
  }

  debug<T>(message: string, metadata?: T): this {
    if (!LOGGER_ENABLED) return this;
    console.info('DEBUG -->', message, {
      source: this.source,
      data: metadata,
      time: new Date(Date.now()),
    });
    return this;
  }

  warn<T>(message: string, metadata?: T): this {
    if (!LOGGER_ENABLED) return this;
    console.warn('WARN -->', message, {
      source: this.source,
      data: metadata,
      time: new Date(Date.now()),
    });
    return this;
  }

  error<T>(message: string, metadata?: T): this {
    if (!LOGGER_ENABLED) return this;
    console.error('ERROR -->', message, {
      source: this.source,
      data: metadata,
      time: new Date(Date.now()),
    });
    return this;
  }

  trace<T>(message: string, metadata?: T): this {
    if (!LOGGER_ENABLED) return this;
    console.trace('TRACE -->', message, {
      source: this.source,
      data: metadata,
      time: new Date(Date.now()),
    });
    return this;
  }

  raw<T>(data: T): this {
    if (!LOGGER_ENABLED) return this;
    console.dir(data);
    return this;
  }

  line(size: number, separator = '-') {
    if (!LOGGER_ENABLED) return this;
    let line = '';
    for (let i = 0; i < size; i++) {
      line += separator;
    }
    console.log(line);
    return this;
  }

  newLine(count = 1) {
    if (!LOGGER_ENABLED) return this;
    let newLines = '';
    for (let i = 0; i < count; i++) {
      newLines += '\n';
    }
    console.log(newLines);
    return this;
  }
}
