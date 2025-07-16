# notFound.js

This file contains the middleware function `notFoundMiddleware` for handling 404 Not Found errors.

## Middleware Function: notFoundMiddleware

This is a middleware function that handles 404 Not Found errors.

### Parameters

- `req`: The request object.
- `res`: The response object.

### Process

1. It sets the response status code to 404.
2. It sends a JSON response with an `error` property set to "Route does not exist".

This middleware function is typically used as the last middleware in the stack, after all routes. If none of the routes match the request URL, this middleware function will be called and it will send a 404 response.

## Export

The `notFoundMiddleware` function is exported for use in other files.
