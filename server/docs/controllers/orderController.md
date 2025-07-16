# Order Controller

This module exports a single function: `createOrder`.

## createOrder

This function is an asynchronous function that creates an order. The machine id and items should be provided in the request body. The user's uid and phone number are retrieved from the request user. If the machine id or items are not provided, it throws a `BadRequestError`. It then creates a temporary items object and a temporary amount object with price, GST, and total all set to 0. It then loops through the items and adds each item's id and quantity to the temporary items object. It then finds an item with the id of the current item.

### Parameters

- `req`: The request object. The machine id and items should be provided in the request body. The user's uid and phone number are retrieved from the request user.
- `res`: The response object.

### Returns

- None. But it creates a temporary items object and a temporary amount object. It then finds an item with the id of the current item.

### Errors

- Throws `BadRequestError` if the machine id or items are not provided in the request body.
