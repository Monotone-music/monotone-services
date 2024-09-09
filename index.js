const fastify = require('fastify')({
    logger: {enabled: false},
});
const dotenv = require('dotenv');
const fastifyCors = require('@fastify/cors');
const fastifyCookie = require('@fastify/cookie');
const logger = require('./init/logging');

if (process.env.NODE_ENV === 'production') {
    dotenv.config({path: '.prod.env'});
} else {
    dotenv.config({path: '.dev.env'});
}

fastify.register(fastifyCookie);
fastify.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
});

logger.info('Application started');
require('./init/db')();
require('./init/routings')(fastify);

const start = async () => {
    try {
        await fastify.listen({port: 3000}, logger.info('Server started on port 3000'));
    } catch (err) {
        logger.error(err);
        process.exit(1);
    }
};

start().then();
