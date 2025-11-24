import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { PulseLoader } from 'react-spinners';
import { useDispatch } from 'react-redux';
import { clearCart } from '../../../redux/cartSlice';
import { getLatestOrder } from '../../../services/order';

export default function PaymentRedirect() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { orderId } = router.query;
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId || typeof orderId !== 'string') {
        console.error('Invalid order ID');
        setStatus('error');
        setMessage('Invalid payment request');
        return;
      }

      // Get the pending machine ID from session storage
      const machineId = sessionStorage.getItem('pendingMachineId');

      // SECURITY: Validate this is a legitimate payment redirect from PhonePe
      const pendingOrderId = sessionStorage.getItem('pendingOrderId');
      if (pendingOrderId !== orderId) {
        console.error('Payment session mismatch - possible manual navigation');
        setStatus('error');
        setMessage('Invalid payment session. Please start a new order.');

        setTimeout(() => {
          router.replace(machineId ? `/${machineId}` : '/');
        }, 3000);
        return;
      }

      // SECURITY: Validate payment session hasn't expired (30 minutes)
      const paymentInitiatedAt = sessionStorage.getItem('paymentInitiatedAt');
      if (paymentInitiatedAt) {
        const initiatedTime = parseInt(paymentInitiatedAt, 10);
        const currentTime = Date.now();
        const thirtyMinutesInMs = 30 * 60 * 1000;

        if (currentTime - initiatedTime > thirtyMinutesInMs) {
          console.error('Payment session expired');
          setStatus('error');
          setMessage('Payment session expired. Please start a new order.');

          // Clear expired session
          sessionStorage.removeItem('pendingOrderId');
          sessionStorage.removeItem('pendingMachineId');
          sessionStorage.removeItem('paymentInitiatedAt');

          setTimeout(() => {
            router.replace(machineId ? `/${machineId}` : '/');
          }, 3000);
          return;
        }
      }

      try {
        console.log('🔍 Verifying PhonePe payment for order:', orderId);

        // Verify payment with backend
        const verifyRes = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/phonepe/verify`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('Token')}`,
            },
            body: JSON.stringify({
              orderId: orderId,
            }),
          }
        );

        const verifyData = await verifyRes.json();
        console.log('Payment verification response:', verifyData);

        // Check actual payment verification, not just API success
        // verifyData.success = API call succeeded
        // verifyData.data?.payment?.verified = Actual payment verification status
        if (verifyRes.status === 200 && verifyData.success && verifyData.data?.payment?.verified === true) {
          console.log('Payment verification successful');
          setStatus('success');
          setMessage('Payment successful! Redirecting to your order...');

          // Fetch the latest order
          try {
            const latestOrder = await getLatestOrder();

            if (latestOrder) {
              // Clear cart from localStorage and Redux
              if (machineId) {
                try {
                  localStorage.removeItem(`golbot_cart_${machineId}`);
                  dispatch(clearCart());
                  console.log('Cart cleared after successful payment');
                } catch (error) {
                  console.error('Error clearing cart:', error);
                }
              }

              // Store order in sessionStorage for detail page
              sessionStorage.setItem(`order_${latestOrder.oid}`, JSON.stringify(latestOrder));

              // Clean up pending session storage
              sessionStorage.removeItem('pendingOrderId');
              sessionStorage.removeItem('pendingMachineId');
              sessionStorage.removeItem('paymentInitiatedAt');

              // Redirect directly to order detail page
              setTimeout(() => {
                router.replace(`/orders/${latestOrder.oid}`);
              }, 1500);
            } else {
              // Fallback to myOrders if can't fetch order
              setTimeout(() => {
                router.replace('/myOrders');
              }, 1500);
            }
          } catch (error) {
            console.error('Error fetching order:', error);
            // Fallback to myOrders on error
            setTimeout(() => {
              router.replace('/myOrders');
            }, 1500);
          }
        } else {
          // Handle different payment states: PENDING, FAILED, ERROR
          const paymentStatus = verifyData.data?.payment?.status || 'UNKNOWN';
          console.error('Payment verification failed:', verifyData);

          // Distinguish between different failure states
          if (paymentStatus === 'PENDING' || verifyData.message?.includes('not yet completed')) {
            // Payment not completed yet (user probably clicked back button or cancelled)
            setStatus('error');
            setMessage('Payment was not completed. You can try again from your active order.');
            console.log('Payment still PENDING - user cancelled or did not complete payment');

            // Don't clear cart for PENDING - user might want to retry
            // Redirect back to menu after delay
            setTimeout(() => {
              router.replace(machineId ? `/${machineId}` : '/');
            }, 3500);
            return;
          }

          // Payment actually FAILED or ERROR
          setStatus('failed');
          setMessage(verifyData.message || 'Payment failed. Please try again or contact support if the issue persists.');

          // Clear cart since payment failed
          if (machineId) {
            try {
              localStorage.removeItem(`golbot_cart_${machineId}`);
              dispatch(clearCart());
              console.log('Cart cleared after payment failure');
            } catch (error) {
              console.error('Error clearing cart:', error);
            }
          }

          // Try to fetch the order and redirect to order detail page
          try {
            const latestOrder = await getLatestOrder();
            if (latestOrder) {
              // Store order in sessionStorage for detail page
              sessionStorage.setItem(`order_${latestOrder.oid}`, JSON.stringify(latestOrder));

              // Clean up pending session storage
              sessionStorage.removeItem('pendingOrderId');
              sessionStorage.removeItem('pendingMachineId');
              sessionStorage.removeItem('paymentInitiatedAt');

              // Redirect to order detail page to show failed status
              setTimeout(() => {
                router.replace(`/orders/${latestOrder.oid}`);
              }, 2000);
            } else {
              // Fallback to menu page if can't fetch order
              setTimeout(() => {
                if (machineId) {
                  router.replace(`/${machineId}`);
                } else {
                  router.replace('/');
                }
              }, 2000);
            }
          } catch (error) {
            console.error('Error fetching failed order:', error);
            // Fallback to menu page on error
            setTimeout(() => {
              if (machineId) {
                router.replace(`/${machineId}`);
              } else {
                router.replace('/');
              }
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('Unable to verify payment status. Please check your order history or contact support.');

        // Clear cart on error as well
        if (machineId) {
          try {
            localStorage.removeItem(`golbot_cart_${machineId}`);
            dispatch(clearCart());
            console.log('Cart cleared after payment verification error');
          } catch (error) {
            console.error('Error clearing cart:', error);
          }
        }

        // Try to fetch order and redirect to detail page, or fallback to menu
        setTimeout(async () => {
          const machineIdFromSession = sessionStorage.getItem('pendingMachineId');
          try {
            const latestOrder = await getLatestOrder();
            if (latestOrder) {
              sessionStorage.setItem(`order_${latestOrder.oid}`, JSON.stringify(latestOrder));

              // Clean up pending session storage
              sessionStorage.removeItem('pendingOrderId');
              sessionStorage.removeItem('pendingMachineId');
              sessionStorage.removeItem('paymentInitiatedAt');

              router.replace(`/orders/${latestOrder.oid}`);
            } else {
              router.replace(machineIdFromSession ? `/${machineIdFromSession}` : '/');
            }
          } catch {
            router.replace(machineIdFromSession ? `/${machineIdFromSession}` : '/');
          }
        }, 3000);
      }
    };

    // Wait a moment for the page to load, then verify
    const timer = setTimeout(verifyPayment, 1000);
    return () => clearTimeout(timer);
  }, [orderId, router, dispatch]);

  // Prevent back button navigation after landing on this page
  useEffect(() => {
    // Push a new history entry to prevent accidental back navigation to PhonePe
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // Prevent back navigation
      window.history.pushState(null, '', window.location.href);
      console.log('Back button blocked - payment verification in progress');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
      case 'error':
        return '❌';
      default:
        return '🔄';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <div className="text-4xl mb-2">{getStatusIcon()}</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {status === 'success' ? 'Payment Successful!' : 'Payment Processing'}
            </h1>
            <p className={`text-lg ${getStatusColor()}`}>
              {message}
            </p>
          </div>
          
          {status === 'processing' && (
            <div className="flex justify-center">
              <PulseLoader color="#3B82F6" size={10} />
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-500">
            Order ID: {orderId}
          </div>

          {(status === 'failed' || status === 'error') && (
            <div className="mt-4">
              <button 
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Return to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}