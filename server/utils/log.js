const winston = require("winston");

console.log("log.js is being executed");

function logger(name) {
  console.log(`Creating logger for: ${name}`);
  return winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format:
      process.env.NODE_ENV !== "production"
        ? winston.format.simple()
        : winston.format.json(),
    defaultMeta: { service: name },
    transports: [new winston.transports.Console()],
  });
}

module.exports = { logger };
