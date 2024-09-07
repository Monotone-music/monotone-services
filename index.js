// app.js
const fastify = require('fastify')({logger: true});

// Run the server
const start = async () => {
    try {
        await fastify.listen({port: 3000});
        // fastify.log.info(`Server listening on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start().then();