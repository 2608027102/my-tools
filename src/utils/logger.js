const winston = require('winston');

const timeFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss.SSS'
});
const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

// 创建logger实例
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(timeFormat, 
    winston.format.errors({stack: true}),
    winston.format.splat(), 
    myFormat, ),
  transports: [
    // 控制台输出
    new winston.transports.Console(),
    // 文件输出
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ],
  // 确保日志目录存在
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// 确保logs目录存在
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 导出与原来相同的API
class Logger {
  static log(message, ...args) {
    logger.info(message, ...args);
  }

  static error(message, ...args) {
    logger.error(message, ...args);
  }

  static warn(message, ...args) {
    logger.warn(message, ...args);
  }

  static info(message, ...args) {
    logger.info(message, ...args);
  }
}

module.exports = Logger;