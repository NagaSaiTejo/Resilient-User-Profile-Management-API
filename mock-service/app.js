const express = require('express');
const app = express();

const PORT = process.env.MOCK_PORT || 8081;
const FAILURE_RATE = parseFloat(process.env.MOCK_SERVICE_FAILURE_RATE || '0.4');
const DELAY_MS = parseInt(process.env.MOCK_SERVICE_DELAY_MS || '200', 10);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/enrich', async (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }

  // Simulate network delay
  if (DELAY_MS > 0) {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }

  // Simulate failure based on failure rate
  if (Math.random() < FAILURE_RATE) {
    const errorStatus = Math.random() < 0.5 ? 500 : 503;
    return res.status(errorStatus).json({ error: 'Internal Server Error (Mocked)' });
  }

  // Success response
  res.status(200).json({
    userId,
    recentActivity: ['logged in', 'viewed profile', 'updated settings'],
    loyaltyScore: Math.floor(Math.random() * 1000)
  });
});

app.listen(PORT, () => {
  console.log(`Mock enrichment service listening on port ${PORT}`);
});
