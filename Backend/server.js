const http = require('http');
const app = require('./app');
const { testConnection, syncDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const startServer = async () => {
  try {
    await testConnection();
    
    await syncDatabase();
    
    server.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API URL: http://localhost:${PORT}`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

startServer();