import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ban, RotateCcw, Home, Clock } from 'lucide-react';
import type { Payment } from '@shared/schema';

export default function PaymentCancelled() {
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
            <Ban className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Cancelled
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            You have cancelled the payment process
          </p>
        </div>

        {payment && (
          <Card className="mb-8 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <Clock className="w-5 h-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Transaction cancelled on {new Date(payment.createdAt).toLocaleString()}
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
                    <p className="capitalize text-orange-600 dark:text-orange-400 font-medium">
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
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                • No amount has been charged to your account
              </p>
              <p>
                • Your order has been saved and you can retry the payment anytime
              </p>
              <p>
                • You can use the same payment details or update them if needed
              </p>
              <p>
                • Contact support if you face any issues during the payment process
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={retryPayment}
            size="lg"
            variant="default"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Continue Payment
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
            Your registration is still active. Complete the payment to access all features.
          </p>
          <p className="mt-2">
            Need assistance? Our support team is here to help.
          </p>
        </div>
      </div>
    </div>
  );
}