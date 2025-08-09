import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, Home, Receipt } from 'lucide-react';
import type { Payment } from '@shared/schema';

export default function PaymentSuccess() {
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

  const downloadReceipt = () => {
    if (!payment) return;
    
    // Create a simple receipt content
    const receiptContent = `
PAYMENT RECEIPT
================

Order ID: ${payment.orderId}
Amount: ₹${payment.amount}
Payment Type: ${payment.paymentType}
Description: ${payment.description}
Status: ${payment.status}
Date: ${new Date(payment.createdAt).toLocaleString()}

Billing Information:
Name: ${payment.billingName}
Email: ${payment.billingEmail}
Phone: ${payment.billingPhone}
Address: ${payment.billingAddress || 'N/A'}
City: ${payment.billingCity}
State: ${payment.billingState}
ZIP: ${payment.billingZip || 'N/A'}

Payment Details:
Tracking ID: ${payment.trackingId || 'N/A'}
Bank Reference: ${payment.bankRefNo || 'N/A'}
Payment Mode: ${payment.paymentMode || 'N/A'}

Thank you for your payment!
`;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your payment has been processed successfully
          </p>
        </div>

        {payment && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Transaction completed on {new Date(payment.createdAt).toLocaleString()}
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
                      Amount Paid
                    </label>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₹{payment.amount}
                    </p>
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
                      Payment Status
                    </label>
                    <p className="capitalize text-green-600 dark:text-green-400 font-medium">
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

                {payment.trackingId && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tracking ID
                    </label>
                    <p className="font-mono">{payment.trackingId}</p>
                  </div>
                )}

                {payment.bankRefNo && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Bank Reference Number
                    </label>
                    <p className="font-mono">{payment.bankRefNo}</p>
                  </div>
                )}

                {payment.paymentMode && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Payment Mode
                    </label>
                    <p className="capitalize">{payment.paymentMode}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={downloadReceipt}
            variant="outline"
            size="lg"
            disabled={!payment}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>
            A confirmation email has been sent to your registered email address.
          </p>
          <p className="mt-2">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}