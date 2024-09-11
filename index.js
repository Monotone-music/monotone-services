const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('./init/logging');

const app = express();

// Environment configuration
if (process.env.NODE_ENV === 'production') {
    dotenv.config({path: '.prod.env'});
} else {
    dotenv.config({path: '.dev.env'});
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
}));

// Logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

logger.info('Application started');

// Database initialization
require('./init/db')();

// Routes
require('./init/routings')(app);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server started on port ${PORT}`);
});