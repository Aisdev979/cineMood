const errorMiddleware = (err, req, res, next) => {

	 try {
        // Mongoose bad objectId
    if (err.name === "CastError") {
        err = new Error("Resource not found");
        err.status = 404;
    }

    // Mongoose duplicate key
   if (err.code === 11000) {
        err = new Error("Duplicated field value entered");
        err.status = 400;
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map(value => value.message);
        err = new Error(message.join(", "));
        err.status = 400;
    }
	const statusCode = err.statusCode || err.status || 500;
	const message = err.message || "Internal Server Error";

	res.status(statusCode).json({
		status: "error",
		message: message,
	});

    next();
    } catch (error) {
        console.error("Error in errorMiddleware:", error);
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred in the error handling middleware.",
        });
    }
};

export default errorMiddleware;