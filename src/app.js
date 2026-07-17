require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const MySQLUnitOfWork = require('./repositories/impl/MySQLUnitOfWork');
const UserService = require('./services/UserService');
const UserController = require('./controllers/UserController');
const createUserRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

async function initializeApp(mockPool = null) {
  try {
    const pool = mockPool || mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const userService = new UserService(() => new MySQLUnitOfWork(pool));
    const userController = new UserController(userService);
    const userRoutes = createUserRoutes(userController);

    app.use('/api/users', userRoutes);
    app.use(errorHandler);

    return app;
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
}

if (require.main === module) {
  initializeApp().then(initializedApp => {
    const PORT = process.env.PORT || 8080;
    initializedApp.listen(PORT, () => {
      console.log(`API Server listening on port ${PORT}`);
    });
  });
}

module.exports = { app, initializeApp };
