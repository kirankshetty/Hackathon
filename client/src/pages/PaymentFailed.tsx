import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, RotateCcw, Home, AlertTriangle } from 'lucide-react';
import type { Payment } from '@shared/schema';

export default function PaymentFailed() {
  const [location, navigate] = useLocation();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('orderId') || localStorage.getItem('currentOrderId');
        
        if (orderId) {
          const paymentData = await apiRequest('GET', `/api/payments/${orderId}`);
          setPayment(paymentData);
          localStorage.removeItem('currentOrderId');
        }
      } catch (error) {
        console.error('Failed to fetch payment details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, []);

  const retryPayment = () => {
    const params = new URLSearchParams({
      amount: payment?.amount || '500',
      type: payment?.paymentType || 'registration',
      description: payment?.description || 'Hackathon Registration Fee'
    });
    navigate(`/payment-checkout?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Failed
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Unfortunately, your payment could not be processed
          </p>
        </div>

        {payment && (
          <Card className="mb-8 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-5 h-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Transaction attempted on {new Date(payment.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Order ID
                    </label>
                    <p className="text-lg font-mono">{payment.orderId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Amount
                    </label>
                    <p className="text-lg font-bold">₹{payment.amount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Payment Type
                    </label>
                    <p className="capitalize">{payment.paymentType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </label>
                    <p className="capitalize text-red-600 dark:text-red-400 font-medium">
                      {payment.status}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Description
                  </label>
                  <p>{payment.description}</p>
                </div>

                {payment.failureMessage && (
                  <div>
                    <label className="text-sm font-medium text-red-600 dark:text-red-400">
                      Failure Reason
                    </label>
                    <p className="text-red-700 dark:text-red-300">{payment.failureMessage}</p>
                  </div>
                )}

                {payment.trackingId && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tracking ID
                    </label>
                    <p className="font-mono">{payment.trackingId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Common reasons for payment failure */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Common Reasons for Payment Failure</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Insufficient funds in your account</li>
              <li>• Incorrect card details or expired card</li>
              <li>• Network connectivity issues</li>
              <li>• Transaction limits exceeded</li>
              <li>• Card blocked by bank for online transactions</li>
              <li>• Browser issues or timeout</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Please check with your bank if the issue persists.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={retryPayment}
            size="lg"
            variant="default"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Need help? Contact our support team for assistance.
          </p>
          <p className="mt-2">
            Your order has been saved and you can retry the payment anytime.
          </p>
        </div>
      </div>
    </div>
  );
}