import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { PulseLoader } from 'react-spinners';

export default function PaymentRedirect() {
  const router = useRouter();
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

      try {
        console.log('🔍 Verifying PhonePe payment for order:', orderId);

        // Get the pending machine ID from session storage
        const machineId = sessionStorage.getItem('pendingMachineId');
        
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
        console.log('📦 Payment verification response:', verifyData);

        if (verifyRes.status === 200 && verifyData.success) {
          console.log('✅ Payment verification successful');
          setStatus('success');
          setMessage('Payment successful! Redirecting...');
          
          // Clean up session storage
          sessionStorage.removeItem('pendingOrderId');
          sessionStorage.removeItem('pendingMachineId');
          
          // Redirect to success page
          setTimeout(() => {
            if (machineId) {
              router.replace(`/${machineId}/payment/${orderId}/success`);
            } else {
              router.replace(`/payment/${orderId}/success`);
            }
          }, 2000);
        } else {
          console.error('❌ Payment verification failed:', verifyData);
          setStatus('failed');
          setMessage(verifyData.message || 'Payment verification failed');
          
          // Redirect to failure page
          setTimeout(() => {
            if (machineId) {
              router.replace(`/${machineId}/payment/${orderId}/failed`);
            } else {
              router.replace(`/payment/${orderId}/failed`);
            }
          }, 3000);
        }
      } catch (error) {
        console.error('❌ Payment verification error:', error);
        setStatus('error');
        setMessage('Failed to verify payment. Please contact support.');
        
        // Redirect to failure page after error
        setTimeout(() => {
          const machineId = sessionStorage.getItem('pendingMachineId');
          if (machineId) {
            router.replace(`/${machineId}/payment/${orderId}/failed`);
          } else {
            router.replace(`/payment/${orderId}/failed`);
          }
        }, 5000);
      }
    };

    // Wait a moment for the page to load, then verify
    const timer = setTimeout(verifyPayment, 1000);
    return () => clearTimeout(timer);
  }, [orderId, router]);

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
              Payment Processing
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