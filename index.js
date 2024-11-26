const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('./init/logging');
const compression = require('compression');
const {ensureTempDirectoryExists} = require('./utils/utils');

const app = express();

// Environment configuration
if (process.env.NODE_ENV === 'production') {
  dotenv.config({path: '.prod.env'});
} else {
  dotenv.config({path: '.dev.env'});
}

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cors({
  origin: '*',
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
require('./init/init_temp_folder')();

// Routes
require('./init/routings')(app);

// Error handling middleware
app.use((req, res, next) => {
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await ensureTempDirectoryExists();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server started on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.warn(`Port ${PORT} is already in use. Please use a different port.`);
      } else {
        logger.error('Server error:', error);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

const server = startServer();

module.exports = server;