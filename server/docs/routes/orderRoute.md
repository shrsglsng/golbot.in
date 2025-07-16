# Order Routes

This module exports an Express router for order related endpoints.

## Endpoints

### POST /create

This endpoint is protected by the `auth` middleware. It calls the `createOrder` function from the `orderController`.

#### Middleware

- `auth`: A middleware that checks if the user is authenticated.

#### Controller

- `createOrder`: A function that creates an order.

### GET /getPaymentOrderStatus

This endpoint calls the `getPaymentOrderStatus` function from the `orderController`.

#### Controller

- `getPaymentOrderStatus`: A function that gets the payment status of an order.

### GET /getOrderOtp

This endpoint is protected by the `auth` middleware. It calls the `getOrderOTP` function from the `orderController`.

#### Middleware

- `auth`: A middleware that checks if the user is authenticated.

#### Controller

- `getOrderOTP`: A function that gets the OTP of an order.

### GET /getLatest

This endpoint is protected by the `auth` middleware. It calls the `getLatestOrder` function from the `orderController`.

#### Middleware

- `auth`: A middleware that checks if the user is authenticated.

#### Controller

- `getLatestOrder`: A function that gets the latest order.

### GET /getIsOrderCompleted

This endpoint is protected by the `auth` middleware. It calls the `getIsOrderCompleted` function from the `orderController`.

#### Middleware

- `auth`: A middleware that checks if the user is authenticated.

#### Controller

- `getIsOrderCompleted`: A function that checks if an order is completed.

### GET /getIsOrderPreparing

This endpoint is protected by the `auth` middleware. It calls the `getIsOrderPreparing` function from the `orderController`.

#### Middleware

- `auth`: A middleware that checks if the user is authenticated.

#### Controller

- `getIsOrderPreparing`: A function that checks if an order is being prepared.

### POST /reportIssue

This endpoint is protected by the `auth` middleware. It calls the `createReportIssue` function from the `orderController`. The issue image should be provided in the request body.

#### Middleware

- `auth`: A middleware that checks if the user is authenticated.
- `uploadImage.single("image")`: A middleware that uploads a single image.

#### Controller

- `createReportIssue`: A function that creates a report issue.

### GET /admin/getallorders

This endpoint is protected by the `admin` middleware. It calls the `getAllOrders` function from the `orderController`.

#### Middleware

- `admin`: A middleware that checks if the user is an admin.

#### Controller

- `getAllOrders`: A function that gets all orders.

## Export

- The router is exported as default.
