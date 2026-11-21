function errorHandler(error, req, res, next) {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    const status = error.statusCode || 500;
    res.status(status).json({
        message: error.message || 'An unexpected server error occurred'
    });
}

module.exports = errorHandler;
