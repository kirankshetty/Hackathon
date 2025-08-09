import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Mail, Phone, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

export default function ApplicantLogin() {
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const sendOtpMutation = useMutation({
    mutationFn: async (identifier: string) => {
      return await apiRequest('/api/applicant/send-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "OTP Sent",
        description: data.message,
      });
      setStep('otp');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ identifier, otp }: { identifier: string; otp: string }) => {
      return await apiRequest('/api/applicant/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier, otp }),
      });
    },
    onSuccess: (data) => {
      // Store session token
      localStorage.setItem('applicantToken', data.sessionToken);
      localStorage.setItem('applicantData', JSON.stringify(data.applicant));
      
      toast({
        title: "Login Successful",
        description: "Welcome to your portal!",
      });
      
      navigate('/applicant/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    },
  });

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email or mobile number",
        variant: "destructive",
      });
      return;
    }
    sendOtpMutation.mutate(identifier);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }
    verifyOtpMutation.mutate({ identifier, otp });
  };

  const isEmail = (value: string) => value.includes('@');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Applicant Portal</CardTitle>
          <CardDescription>
            {step === 'identifier' 
              ? 'Enter your registered email or mobile number to receive an OTP'
              : 'Enter the OTP sent to your registered email'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 'identifier' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Mobile Number</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isEmail(identifier) ? (
                      <Mail className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Phone className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="your@email.com or +1234567890"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10"
                    disabled={sendOtpMutation.isPending}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={sendOtpMutation.isPending}
              >
                {sendOtpMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  disabled={verifyOtpMutation.isPending}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  OTP sent to: <span className="font-medium">{identifier}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={verifyOtpMutation.isPending}
                >
                  {verifyOtpMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setStep('identifier');
                    setOtp('');
                  }}
                  disabled={verifyOtpMutation.isPending}
                >
                  Back to Email/Mobile
                </Button>
              </div>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}