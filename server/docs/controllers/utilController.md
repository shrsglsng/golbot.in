# Util Controller

This module exports a single function: `getAllItems`.

## getAllItems

This function is an asynchronous function that retrieves all items. It finds all items in the database and excludes the `_id` field from the result. It then sends a response with the status code of `OK` (200) along with the items.

### Parameters

- `req`: The request object.
- `res`: The response object.

### Returns

- A JSON response with the items.

### Dependencies

- `http-status-codes`: A library for HTTP status codes.
- `itemModel.js`: The model for items.
- `errors.js`: A module for custom errors.
