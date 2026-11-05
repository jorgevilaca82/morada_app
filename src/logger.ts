import pino from 'pino';

const __dirname = import.meta.dirname;

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: { destination: `${__dirname}/server.log` },
    },
    {
      target: 'pino-pretty',
    },
  ],
});

const logger = pino(
  {
    level: process.env.PINO_LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);

export default logger;