/**
 * Server Configuration Checker
 * ----------------------------
 * This script helps diagnose issues with the API endpoints
 * by printing server configuration information.
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    port: port,
    endpoints: [
      '/health',
      '/server-info',
      '/api/places/nearby'
    ]
  });
});

// Server information endpoint
app.get('/server-info', (req, res) => {
  res.json({
    nodejs: process.version,
    platform: process.platform,
    arch: process.arch,
    hostname: require('os').hostname(),
    port: port,
    env: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for Google Places API proxying
app.get('/api/places/nearby', (req, res) => {
  const { lat, lng } = req.query;

  // Send test data
  res.json({
    status: 'OK',
    requestInfo: {
      receivedParams: req.query,
      endpoint: '/api/places/nearby',
      requiredParams: ['lat', 'lng'],
      missingParams: !lat || !lng ? ['lat', 'lng'].filter(p => !req.query[p]) : []
    },
    results: [
      {
        name: 'CIH Bank Central (Test)',
        geometry: {
          location: {
            lat: 33.589500,
            lng: -7.632600
          }
        }
      }
    ]
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server diagnostic tool running on port ${port}`);
  console.log(`Try accessing: http://localhost:${port}/health`);
});