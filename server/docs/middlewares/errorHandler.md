# errorHandler.js

This file contains the middleware function `errorHandlerMiddleware` for handling errors in the application.

## Import Statements

- `StatusCodes`: This is an enumeration of HTTP status codes, imported from the `http-status-codes` library.

## Middleware Function: errorHandlerMiddleware

This is a middleware function that handles errors in the application.

### Parameters

- `err`: The error object.
- `req`: The request object.
- `res`: The response object.
- `next`: The next middleware function.

### Process

1. It first creates a `defaultError` object with the error's status code and message. If these are not available, it defaults to `StatusCodes.INTERNAL_SERVER_ERROR` and a generic error message.
2. If the error is a validation error (`err.name == "ValidationError"`), it sets the status code to `StatusCodes.BAD_REQUEST` and the message to a comma-separated list of all validation error messages.
3. If the error is a unique value error (`err.code === 11000`), it sets the status code to `StatusCodes.BAD_REQUEST` and the message to indicate that the field has to be unique.
4. It logs the error message to the console.
5. It sends a response with the status code and the error message.

### Errors

This middleware function is designed to handle all errors in the application, so it does not throw any errors itself.

## Export

The `errorHandlerMiddleware` function is exported for use in other files.
