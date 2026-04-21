
const { SERVER_ERROR } = require('../constants/statusCodes');
const messages = require('../constants/messages');

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message: err.message || messages.SERVER_ERROR,
  });
};

module.exports = errorMiddleware;