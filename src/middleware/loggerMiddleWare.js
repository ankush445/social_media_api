const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  // jab response complete ho
  res.on('finish', () => {
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      time: Date.now() - start + 'ms',
      user: req.user?._id || 'Guest',
    };

    console.log(log);
  });

  next();
};

module.exports = loggerMiddleware;