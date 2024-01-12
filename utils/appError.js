class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'Error';
        this.isOperational = true;

        // When a new object is created and the constructor is called. 
        //That function call will not appear in the stack trace and will not pollute it
        Error.captureStackTrace(this, this.contructor);
    }
}

module.exports = AppError