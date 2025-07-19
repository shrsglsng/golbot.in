# Frontend Integration Examples

## Order Status Timeline Component

```jsx
// React component to display order status timeline
import React, { useState, useEffect } from 'react';

const OrderTimeline = ({ orderId }) => {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderTimeline = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const data = await response.json();
        setTimeline(data.data.orderTimeline);
      } catch (error) {
        console.error('Failed to fetch order timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderTimeline();
  }, [orderId]);

  if (loading) return <div>Loading timeline...</div>;

  return (
    <div className="order-timeline">
      <h3>Order Timeline</h3>
      <div className="timeline-container">
        {timeline?.timeline.map((event, index) => (
          <div key={index} className="timeline-event">
            <div className="timeline-status">{event.status}</div>
            <div className="timeline-time">
              {new Date(event.timestamp).toLocaleString()}
            </div>
            <div className="timeline-actor">Changed by: {event.actor}</div>
            <div className="timeline-reason">{event.reason}</div>
            {event.metadata && (
              <div className="timeline-metadata">
                <details>
                  <summary>Additional Info</summary>
                  <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Admin Order Management Component

```jsx
// React component for admin to manage order status
import React, { useState } from 'react';

const OrderStatusManager = ({ order, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const statusOptions = [
    'PENDING',
    'PAID', 
    'READY',
    'PREPARING',
    'COMPLETED',
    'CANCELLED'
  ];

  const handleStatusUpdate = async () => {
    if (!newStatus || !reason) {
      alert('Please select a status and provide a reason');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (response.ok) {
        const data = await response.json();
        onStatusUpdate(data.data.order);
        setNewStatus('');
        setReason('');
        alert('Order status updated successfully');
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="order-status-manager">
      <h4>Update Order Status</h4>
      <div className="current-status">
        Current Status: <span className="status-badge">{order.status}</span>
      </div>
      
      <div className="status-update-form">
        <select 
          value={newStatus} 
          onChange={(e) => setNewStatus(e.target.value)}
          disabled={updating}
        >
          <option value="">Select new status</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <textarea
          placeholder="Reason for status change..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={updating}
          rows={3}
        />

        <button 
          onClick={handleStatusUpdate}
          disabled={updating || !newStatus || !reason}
        >
          {updating ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </div>
  );
};
```

## Payment History Component

```jsx
// React component to display payment history
import React, { useState, useEffect } from 'react';

const PaymentHistory = ({ paymentId }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const response = await fetch(`/api/admin/payments/${paymentId}/history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const data = await response.json();
        setHistory(data.data.paymentHistory);
      } catch (error) {
        console.error('Failed to fetch payment history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [paymentId]);

  if (loading) return <div>Loading payment history...</div>;

  return (
    <div className="payment-history">
      <h3>Payment History</h3>
      <div className="payment-info">
        <p>Payment ID: {history?.paymentId}</p>
        <p>Current Status: {history?.currentStatus}</p>
        <p>Verified: {history?.verified ? 'Yes' : 'No'}</p>
        <p>Amount: ₹{history?.amount}</p>
      </div>

      <div className="history-timeline">
        {history?.history.map((event, index) => (
          <div key={index} className="history-event">
            <div className="event-status">{event.status}</div>
            <div className="event-time">
              {new Date(event.timestamp).toLocaleString()}
            </div>
            <div className="event-actor">By: {event.actor}</div>
            <div className="event-reason">{event.reason}</div>
            
            {event.razorpayData && Object.keys(event.razorpayData).length > 0 && (
              <div className="razorpay-data">
                <details>
                  <summary>Razorpay Details</summary>
                  <ul>
                    {event.razorpayData.paymentId && (
                      <li>Payment ID: {event.razorpayData.paymentId}</li>
                    )}
                    {event.razorpayData.method && (
                      <li>Method: {event.razorpayData.method}</li>
                    )}
                    {event.razorpayData.bank && (
                      <li>Bank: {event.razorpayData.bank}</li>
                    )}
                    {event.razorpayData.errorCode && (
                      <li>Error: {event.razorpayData.errorCode} - {event.razorpayData.errorDescription}</li>
                    )}
                  </ul>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Customer Order Tracking Component

```jsx
// React component for customers to track their order
import React, { useState, useEffect } from 'react';

const CustomerOrderTracking = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });
        const data = await response.json();
        setOrder(data.data.order);
      } catch (error) {
        console.error('Failed to fetch order status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStatus();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrderStatus, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const getStatusMessage = (status) => {
    const messages = {
      'PENDING': 'Waiting for payment confirmation',
      'PAID': 'Payment confirmed! Your order is being prepared',
      'READY': 'Your order is ready for pickup!',
      'PREPARING': 'Your order is being prepared',
      'COMPLETED': 'Order completed. Thank you!',
      'CANCELLED': 'Order has been cancelled'
    };
    return messages[status] || status;
  };

  const getStatusProgress = (status) => {
    const statusOrder = ['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED'];
    return statusOrder.indexOf(status) + 1;
  };

  if (loading) return <div>Loading order status...</div>;

  return (
    <div className="order-tracking">
      <h3>Order Tracking</h3>
      <div className="order-info">
        <p>Order ID: {order?.id}</p>
        <p>Amount: ₹{order?.amount?.total}</p>
        <p>Machine: {order?.machine?.name} - {order?.machine?.location}</p>
      </div>

      <div className="status-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(getStatusProgress(order?.status) / 5) * 100}%` }}
          />
        </div>
        <div className="status-steps">
          {['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED'].map(status => (
            <div 
              key={status} 
              className={`step ${order?.status === status ? 'active' : ''} ${getStatusProgress(order?.status) > getStatusProgress(status) ? 'completed' : ''}`}
            >
              {status}
            </div>
          ))}
        </div>
      </div>

      <div className="current-status">
        <h4>{order?.status}</h4>
        <p>{getStatusMessage(order?.status)}</p>
        {order?.estimatedCompletionTime && (
          <p>Estimated completion: {new Date(order.estimatedCompletionTime).toLocaleTimeString()}</p>
        )}
        {order?.status === 'READY' && order?.orderOtp && (
          <div className="otp-display">
            <p>Your pickup OTP: <strong>{order.orderOtp}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};
```

## CSS Styles

```css
/* Timeline and Status Tracking Styles */
.order-timeline, .payment-history {
  max-width: 600px;
  margin: 20px 0;
}

.timeline-container, .history-timeline {
  position: relative;
  padding-left: 30px;
}

.timeline-container::before, .history-timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
}

.timeline-event, .history-event {
  position: relative;
  margin-bottom: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.timeline-event::before, .history-event::before {
  content: '';
  position: absolute;
  left: -19px;
  top: 20px;
  width: 10px;
  height: 10px;
  background: #007bff;
  border-radius: 50%;
}

.timeline-status, .event-status {
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.timeline-time, .event-time {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.pending { background: #ffc107; color: #000; }
.status-badge.paid { background: #28a745; color: #fff; }
.status-badge.ready { background: #17a2b8; color: #fff; }
.status-badge.preparing { background: #fd7e14; color: #fff; }
.status-badge.completed { background: #6f42c1; color: #fff; }
.status-badge.cancelled { background: #dc3545; color: #fff; }

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

.status-steps {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.step {
  padding: 8px 12px;
  border-radius: 4px;
  background: #e0e0e0;
  font-size: 0.8em;
  text-align: center;
}

.step.active {
  background: #007bff;
  color: white;
}

.step.completed {
  background: #28a745;
  color: white;
}
```

These examples show how the new status history tracking can be integrated into a frontend application, providing better visibility and control over order and payment states.
