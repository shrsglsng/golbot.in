# Auth Routes

This module exports an Express router for authentication related endpoints.

## Endpoints

### POST /createAnon

This endpoint calls the `anonRegister` function from the `authController`.

#### Controller

- `anonRegister`: A function that creates an anonymous user.

### POST /sendOTP

This endpoint calls the `phoneSendOtp` function from the `authController`.

#### Controller

- `phoneSendOtp`: A function that sends an OTP to a user's phone number.

### POST /verifyOTP

This endpoint calls the `verifyOtp` function from the `authController`.

#### Controller

- `verifyOtp`: A function that verifies the OTP sent to a user's phone number.

### POST /admin/register

This endpoint is protected by the `admin` middleware. It calls the `adminRegister` function from the `authController`.

#### Middleware

- `admin`: A middleware that checks if the user is an admin.

#### Controller

- `adminRegister`: A function that registers an admin.

### POST /admin/login

This endpoint calls the `adminLogin` function from the `authController`.

#### Controller

- `adminLogin`: A function that logs in an admin.

### GET /admin/getAllAdmins

This endpoint is protected by the `admin` middleware. It calls the `getAllAdmins` function from the `authController`.

#### Middleware

- `admin`: A middleware that checks if the user is an admin.

#### Controller

- `getAllAdmins`: A function that gets all admins.

### POST /admin/machineRegister

This endpoint is protected by the `admin` middleware. It calls the `machineRegister` function from the `authController`.

#### Middleware

- `admin`: A middleware that checks if the user is an admin.

#### Controller

- `machineRegister`: A function that registers a machine.

### GET /admin/getAllMachines

This endpoint is protected by the `admin` middleware. It calls the `getAllMachines` function from the `authController`.

#### Middleware

- `admin`: A middleware that checks if the user is an admin.

#### Controller

- `getAllMachines`: A function that gets all machines.

## Export

- The router is exported as default.
