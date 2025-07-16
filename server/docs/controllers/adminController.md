# Admin Controller

This module exports two functions: `updateItem` and `getReportIssues`.

## updateItem

This function is an asynchronous function that updates an item. The item's id, name, description, image URL, price, and GST should be provided in the request body. If the id is not provided, it throws a `BadRequestError`. It then updates the item in the database and sends a response with the status code of `OK` (200) along with a success message.

### Parameters

- `req`: The request object. The item's id, name, description, image URL, price, and GST should be provided in the request body.
- `res`: The response object.

### Returns

- A JSON response with a success message.

### Errors

- Throws `BadRequestError` if the id is not provided in the request body.

## getReportIssues

This function is an asynchronous function that gets reported issues. The order id, phone, reported date, and machine id can be provided in the request query. It then creates a query object based on the provided query parameters. If the order id is provided and its length is not 24, it throws a `BadRequestError`. It then calculates the page number for pagination.

### Parameters

- `req`: The request object. The order id, phone, reported date, and machine id can be provided in the request query.
- `res`: The response object.

### Returns

- None. But it creates a query object based on the provided query parameters and calculates the page number for pagination.

### Errors

- Throws `BadRequestError` if the order id is provided and its length is not 24.
