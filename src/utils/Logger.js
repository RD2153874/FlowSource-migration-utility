// Logger - Centralized logging utility
import winston from 'winston';
import chalk from 'chalk';

export class Logger {
  static instance = null;

  constructor() {
    if (Logger.instance) {
      return Logger.instance;
    }

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'flowsource-agent' },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ]
    });

    // Add console transport with colors for development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf(({ level, message, timestamp }) => {
            return `${chalk.gray(timestamp)} ${level}: ${message}`;
          })
        )
      }));
    }

    Logger.instance = this;
  }

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level) {
    this.logger.level = level;
    this.logger.transports.forEach(transport => {
      transport.level = level;
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  // Specialized logging methods for migration steps
  step(stepNumber, totalSteps, message) {
    const stepInfo = chalk.blue(`[${stepNumber}/${totalSteps}]`);
    this.info(`${stepInfo} ${message}`);
  }

  success(message) {
    this.info(chalk.green(`✅ ${message}`));
  }

  failure(message) {
    this.error(chalk.red(`❌ ${message}`));
  }

  warning(message) {
    this.warn(chalk.yellow(`⚠️ ${message}`));
  }

  progress(message) {
    this.info(chalk.blue(`🔄 ${message}`));
  }

  // File operation logging
  fileCreated(filePath) {
    this.debug(chalk.green(`📄 Created: ${filePath}`));
  }

  fileCopied(source, destination) {
    this.debug(chalk.blue(`📋 Copied: ${source} → ${destination}`));
  }

  fileUpdated(filePath) {
    this.debug(chalk.yellow(`📝 Updated: ${filePath}`));
  }

  fileDeleted(filePath) {
    this.debug(chalk.red(`🗑️ Deleted: ${filePath}`));
  }

  // Migration specific logging
  migrationStarted(config) {
    this.info('🚀 FlowSource migration started');
    this.info(`📍 Source: ${config.sourcePath}`);
    this.info(`📍 Destination: ${config.destinationPath}`);
    this.info(`📍 Application: ${config.applicationName}`);
    this.info(`📍 Phase: ${config.phase}`);
  }

  migrationCompleted(duration) {
    this.success(`Migration completed in ${duration}ms`);
  }

  migrationFailed(error, duration) {
    this.failure(`Migration failed after ${duration}ms: ${error.message}`);
  }

  phaseStarted(phase) {
    this.info(`🎯 Starting Phase ${phase}`);
  }

  phaseCompleted(phase) {
    this.success(`Phase ${phase} completed`);
  }

  validationStarted() {
    this.info('🔍 Starting validation...');
  }

  validationCompleted(results) {
    this.info(`📊 Validation completed: ${results.passed} passed, ${results.failed} failed, ${results.warnings} warnings`);
  }
}
