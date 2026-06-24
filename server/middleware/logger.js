const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl || req.url} → ${res.statusCode} (${duration}ms)`);
  });

  next();
};

export default requestLogger;
