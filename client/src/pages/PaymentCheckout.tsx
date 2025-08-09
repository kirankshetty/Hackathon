import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CreditCard, Shield, Clock } from 'lucide-react';

interface PaymentCheckoutProps {
  amount: number;
  paymentType: string;
  description: string;
}

export default function PaymentCheckout() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 500,
    paymentType: 'registration',
    description: 'Hackathon Registration Fee',
    billingName: '',
    billingEmail: '',
    billingPhone: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: ''
  });

  useEffect(() => {
    // Get payment details from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const amount = params.get('amount');
    const type = params.get('type');
    const desc = params.get('description');

    if (amount) setPaymentData(prev => ({ ...prev, amount: parseFloat(amount) }));
    if (type) setPaymentData(prev => ({ ...prev, paymentType: type }));
    if (desc) setPaymentData(prev => ({ ...prev, description: desc }));
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Validate required fields
      const requiredFields = ['billingName', 'billingEmail', 'billingPhone', 'billingCity', 'billingState'];
      const missingFields = requiredFields.filter(field => !paymentData[field as keyof typeof paymentData]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create payment intent
      const response = await apiRequest('/api/payments/create', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      const { orderId, encryptedData, accessCode, paymentUrl } = response;

      // Create form and submit to CCAvenue
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentUrl;

      const encDataInput = document.createElement('input');
      encDataInput.type = 'hidden';
      encDataInput.name = 'encRequest';
      encDataInput.value = encryptedData;

      const accessCodeInput = document.createElement('input');
      accessCodeInput.type = 'hidden';
      accessCodeInput.name = 'access_code';
      accessCodeInput.value = accessCode;

      form.appendChild(encDataInput);
      form.appendChild(accessCodeInput);
      document.body.appendChild(form);
      
      // Store order ID for tracking
      localStorage.setItem('currentOrderId', orderId);
      
      form.submit();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Payment Checkout
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Complete your payment securely with CCAvenue
          </p>
        </div>

        <div className="grid gap-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Item:</span>
                  <span className="font-medium">{paymentData.description}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold text-lg">₹{paymentData.amount}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Payment Gateway:</span>
                  <span>CCAvenue (Secure)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Please provide your billing details for payment processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingName">Full Name *</Label>
                    <Input
                      id="billingName"
                      value={paymentData.billingName}
                      onChange={(e) => handleInputChange('billingName', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingEmail">Email Address *</Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      value={paymentData.billingEmail}
                      onChange={(e) => handleInputChange('billingEmail', e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="billingPhone">Phone Number *</Label>
                  <Input
                    id="billingPhone"
                    value={paymentData.billingPhone}
                    onChange={(e) => handleInputChange('billingPhone', e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="billingAddress">Address</Label>
                  <Textarea
                    id="billingAddress"
                    value={paymentData.billingAddress}
                    onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="billingCity">City *</Label>
                    <Input
                      id="billingCity"
                      value={paymentData.billingCity}
                      onChange={(e) => handleInputChange('billingCity', e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingState">State *</Label>
                    <Input
                      id="billingState"
                      value={paymentData.billingState}
                      onChange={(e) => handleInputChange('billingState', e.target.value)}
                      placeholder="State"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingZip">ZIP Code</Label>
                    <Input
                      id="billingZip"
                      value={paymentData.billingZip}
                      onChange={(e) => handleInputChange('billingZip', e.target.value)}
                      placeholder="ZIP"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-200">
                    Secure Payment
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your payment is processed securely through CCAvenue with 256-bit SSL encryption.
                    We do not store your credit card information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Pay ₹{paymentData.amount}
                  </div>
                )}
              </Button>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-3">
                By clicking "Pay", you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}