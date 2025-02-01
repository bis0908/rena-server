import DailyRotateFile from "winston-daily-rotate-file";
import moment from "moment-timezone";
import path from "path";
import winston from "winston";

const __dirname = path.resolve();

const PROJECT_ROOT = path.join(__dirname, "..");

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
  const time = moment(timestamp).tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
  return `[${time}] [${level}] ${message}`;
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(winston.format.colorize(), myFormat),
});

const loggingTransport = new DailyRotateFile({
  level: "info",
  filename: path.join(process.cwd(), "logs", "renaSender-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "5m",
  maxFiles: "14d",
  format: myFormat,
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), myFormat),
  transports: [consoleTransport, loggingTransport],
});

logger.stream = {
  write: function (message) {
    logger.info(message);
  },
};

function formatLogArguments(args) {
  args = Array.prototype.slice.call(args);

  const stackInfo = getStackInfo(1);
  if (stackInfo) {
    const calleeStr = `[${path.basename(stackInfo.relativePath)}:${
      stackInfo.line
    }]`;

    if (typeof args[0] === "string") {
      args[0] = `${calleeStr} ${args[0]}`;
    } else {
      args.unshift(calleeStr);
    }
  }

  return args;
}

function getStackInfo(stackIndex) {
  const stacklist = new Error().stack.split("\n").slice(3);

  const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
  const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

  const s = stacklist[stackIndex] || stacklist[0];
  const sp = stackReg.exec(s) || stackReg2.exec(s);

  if (sp && sp.length === 5) {
    return {
      method: sp[1],
      relativePath: path.relative(PROJECT_ROOT, sp[2]),
      line: sp[3],
      pos: sp[4],
      file: path.basename(sp[2]),
      stack: stacklist.join("\n"),
    };
  }
}

logger.debug = function () {
  logger.log({
    level: "debug",
    message: formatLogArguments(arguments).join(" "),
  });
};

logger.info = function () {
  logger.log({
    level: "info",
    message: formatLogArguments(arguments).join(" "),
  });
};

logger.warn = function () {
  logger.log({
    level: "warn",
    message: formatLogArguments(arguments).join(" "),
  });
};

logger.error = function () {
  logger.log({
    level: "error",
    message: formatLogArguments(arguments).join(" "),
  });
};

export default logger;
