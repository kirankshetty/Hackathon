import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ConfirmParticipation() {
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const confirmationCode = urlParams.get('code');
    setCode(confirmationCode);
  }, []);

  const confirmMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest("/api/confirm-participation", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
    },
    onSuccess: () => {
      setConfirmed(true);
      toast({
        title: "Participation Confirmed!",
        description: "Your participation has been successfully confirmed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Confirmation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    if (code) {
      confirmMutation.mutate(code);
    }
  };

  if (!code) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">
              This confirmation link is invalid or has expired. Please check your email for the correct link.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-emerald-700">Participation Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-emerald-800 font-medium">Your Registration Code</p>
              <p className="font-mono text-lg font-bold text-emerald-900 mt-1">{code}</p>
            </div>
            <p className="text-slate-600">
              Congratulations! Your participation has been confirmed. Please bring your registration code on the event day.
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">What's Next?</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Save your registration code safely</li>
                <li>• Wait for event day details via email</li>
                <li>• Prepare for an amazing hackathon experience!</li>
              </ul>
            </div>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-blue-700">Confirm Your Participation</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium mb-2">Registration Code</p>
            <p className="font-mono text-lg font-bold text-blue-900">{code}</p>
          </div>
          
          <div className="text-left space-y-4">
            <p className="text-slate-600">
              Congratulations! You have been selected to participate in our hackathon.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">By confirming, you agree to:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Attend the hackathon event on the scheduled date</li>
                <li>• Follow all event rules and guidelines</li>
                <li>• Bring your registration code for check-in</li>
                <li>• Participate actively in the competition</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {confirmMutation.isPending ? "Confirming..." : "Confirm Participation"}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
