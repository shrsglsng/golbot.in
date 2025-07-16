# Auth Controller

This module exports two functions: `anonRegister` and `phoneSendOtp`.

## anonRegister

This function is an asynchronous function that creates an anonymous user with a predefined phone number "7089764567". It then creates a JWT token for the user and sends a response with the status code of `CREATED` (201) along with the user's id and token.

### Parameters

- `req`: The request object.
- `res`: The response object.

### Returns

- A JSON response with the user's id and token.

## phoneSendOtp

This function is an asynchronous function that sends an OTP to a user's phone number. The phone number should be provided in the request body. If the phone number is not provided, it throws a `BadRequestError`. It then generates a random OTP between 1000 and 9999. It then finds and updates the user with the provided phone number and the generated OTP. If the user does not exist, it creates a new user. It then prepares a configuration object for the HTTP request to send the OTP. The HTTP request is currently commented out.

### Parameters

- `req`: The request object. The phone number should be provided in the request body.
- `res`: The response object.

### Returns

- None. But it prepares a configuration object for the HTTP request to send the OTP.

### Errors

- Throws `BadRequestError` if the phone number is not provided in the request body.
