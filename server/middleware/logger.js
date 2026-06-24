const requestLogger = (req, res, next) => {
  const start = Date.now();
  const isAuthRequest = req.originalUrl && req.originalUrl.includes('/api/auth');

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (isAuthRequest) {
      console.log(`=== AUTH REQUEST DIAGNOSTICS ===
Method: ${req.method}
URL: ${req.originalUrl || req.url}
Origin: ${req.headers.origin || 'No Origin'}
Headers: ${JSON.stringify(req.headers, null, 2)}
Response Status: ${res.statusCode}
Response Time: ${duration}ms
=================================`);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log(`[${req.method}] ${req.originalUrl || req.url} → ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
};

export default requestLogger;
