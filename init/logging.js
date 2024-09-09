const fastify = require('fastify')({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname'
            }
        },
        level: process.env.LOG_LEVEL || 'info'
    },
    stream: true,
});

module.exports = {
    info: (...args) => fastify.log.info(...args),
    error: (...args) => fastify.log.error(...args),
    warn: (...args) => fastify.log.warn(...args),
};
