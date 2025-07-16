# auth.js

This file contains the middleware function `auth` for user authentication.

## Import Statements

- `jsonwebtoken`: This is a library that helps in creating JSON Web Tokens (JWTs).
- `UnauthenticatedError`: This is a custom error class imported from the `utils/errors.js` file.

## Middleware Function: auth

This is an asynchronous middleware function that verifies the JWT of a user.

### Parameters

- `req`: The request object.
- `res`: The response object.
- `next`: The next middleware function.

### Process

1. It first checks if the `authorization` header is present in the request headers and if it starts with "Bearer". If not, it throws an `UnauthenticatedError`.
2. It then extracts the JWT from the `authorization` header.
3. The JWT is verified using the secret key stored in `process.env.EXPAPP_JWT_SECRET`.
4. The payload of the JWT, which contains the user id and phone number, is attached to the request object.
5. If all checks pass, it calls the `next()` function to proceed to the next middleware or route handler.

### Errors

If any error occurs during the JWT verification process, it throws an `UnauthenticatedError` with the message "Authentication Invalid".

## Export

The `auth` middleware function is exported for use in other files.
