const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 404);
};


const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    //Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });

        // Programming error or other unknown error: don't leak error details   
    } else {
        //1)Log error
        console.error('Error ', err);

        //2)SEND A GENERIC MESSAGE
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong'
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);

    } else if (process.env.NODE_ENV === 'production ') {
        let error = { ...err };
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        sendErrorProd(error, res);
    }
};


///In the package.json the script is this 
// "start:prod": "set NODE_ENV=production && nodemon server.js",
//there is space after production
// if there is space you should also leave space in the else if block