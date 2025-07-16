# Machine Controller

This module exports four functions: `updateIpAddress`, `getIpAddress`, and `startMachine`.

## updateIpAddress

This function is an asynchronous function that updates the IP address of a machine. The machine id should be provided in the request parameters and the IP address should be provided in the request body. If the machine is not found, it throws a `NotFoundError`. It then sends a response with the status code of `OK` (200) along with a success message.

### Parameters

- `req`: The request object. The machine id should be provided in the request parameters and the IP address should be provided in the request body.
- `res`: The response object.

### Returns

- A JSON response with a success message.

### Errors

- Throws `NotFoundError` if the machine is not found.

## getIpAddress

This function is an asynchronous function that retrieves the IP address of a machine. The machine id should be provided in the request parameters. If the machine is not found, it throws a `NotFoundError`. It then sends a response with the status code of `OK` (200) along with the machine's IP address.

### Parameters

- `req`: The request object. The machine id should be provided in the request parameters.
- `res`: The response object.

### Returns

- A JSON response with the machine's IP address.

### Errors

- Throws `NotFoundError` if the machine is not found.

## startMachine

This function is an asynchronous function that starts a machine. The order OTP and machine id should be provided in the request body. If the order OTP or machine id is not provided, it throws a `BadRequestError`. It then finds an order with the provided order OTP and machine id.

### Parameters

- `req`: The request object. The order OTP and machine id should be provided in the request body.
- `res`: The response object.

### Returns

- None. But it finds an order with the provided order OTP and machine id.

### Errors

- Throws `BadRequestError` if the order OTP or machine id is not provided in the request body.
