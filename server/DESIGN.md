## Database
Admin
email - string; required - true, unique: true
location - string
password

Item
name - string
desc - string
imgUrl - string
price - number
gst - number
isAvailable - boolean
qtyLeft - number

Machine
mid - string; required - true, unique: true
mstatus - enum ["CONNECTED", "DISCONNECTED"]
location - string
password - string
ipAddress - string
lastPingedAt - string

Order
uid - reference User
machineId - Reference Machine
amount : {price - number, gst - number, total - number}
orderStatus - ["PENDING", "READY", "PREPARING", "COMPLETED", "CANCELLED"]
orderCompleted - boolean

OrderItem
orderId - reference Order
itemId - reference Item 
qty - number
priceAtOrderTime - number

Payment
orderId - reference order
razorpayorderId - string // razorpay
razorpaypaymentId - string // razorpay
signature - string
amount - number
currency - INR (default - INR)
verified - Boolean
status - enum (SUCCESS, FAILURE)
source - string

User
phone - string; required - true, unique: true
verified - boolean
OTP - string { expires: '1m' }