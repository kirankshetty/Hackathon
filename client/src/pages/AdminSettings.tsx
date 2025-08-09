import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Mail, 
  Shield, 
  Key, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Info
} from "lucide-react";

const emailSettingsSchema = z.object({
  emailHost: z.string().min(1, "SMTP host is required"),
  emailPort: z.string().min(1, "SMTP port is required"),
  emailUser: z.string().email("Valid email address required"),
  emailPass: z.string().min(1, "Password is required"),
  fromEmail: z.string().email("Valid sender email required"),
  emailService: z.enum(["gmail", "custom"]).default("gmail"),
  enableEmails: z.boolean().default(true),
});

type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;

export default function AdminSettings() {
  const { toast } = useToast();
  const [showGmailInstructions, setShowGmailInstructions] = useState(false);

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["/api/admin/email-settings"],
  });

  const form = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      emailHost: currentSettings?.emailHost || "smtp.gmail.com",
      emailPort: currentSettings?.emailPort || "587",
      emailUser: currentSettings?.emailUser || "",
      emailPass: currentSettings?.emailPass || "",
      fromEmail: currentSettings?.fromEmail || "",
      emailService: currentSettings?.emailService || "gmail",
      enableEmails: currentSettings?.enableEmails ?? true,
    },
  });

  const emailService = form.watch("emailService");

  const updateEmailSettings = useMutation({
    mutationFn: async (data: EmailSettingsFormData) => {
      return await apiRequest("/api/admin/email-settings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Settings Updated",
        description: "Your email configuration has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testEmailConnection = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/test-email", {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Test Successful",
        description: "Email service is configured correctly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Email Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailSettingsFormData) => {
    updateEmailSettings.mutate(data);
  };

  // Update form values when service type changes
  const handleServiceChange = (service: "gmail" | "custom") => {
    if (service === "gmail") {
      form.setValue("emailHost", "smtp.gmail.com");
      form.setValue("emailPort", "587");
      setShowGmailInstructions(true);
    } else {
      form.setValue("emailHost", "");
      form.setValue("emailPort", "");
      setShowGmailInstructions(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-slate-600" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Admin Settings</h2>
                  <p className="text-slate-500 mt-1">Configure email services and system preferences</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Email Service Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>Email Service Configuration</span>
              </CardTitle>
              <p className="text-slate-600">Configure SMTP settings for sending registration confirmations and notifications</p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Enable/Disable Emails */}
                  <FormField
                    control={form.control}
                    name="enableEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Email Notifications</FormLabel>
                          <FormDescription>
                            Send confirmation emails to applicants after registration
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("enableEmails") && (
                    <>
                      {/* Email Service Type */}
                      <FormField
                        control={form.control}
                        name="emailService"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Service Provider</FormLabel>
                            <Select 
                              onValueChange={(value: "gmail" | "custom") => {
                                field.onChange(value);
                                handleServiceChange(value);
                              }} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select email service" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="gmail">Gmail (Recommended)</SelectItem>
                                <SelectItem value="custom">Custom SMTP Server</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Gmail Instructions */}
                      {emailService === "gmail" && (
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Gmail Configuration Required:</strong>
                            <ol className="mt-2 ml-4 space-y-1 text-sm">
                              <li>1. Enable 2-Factor Authentication on your Gmail account</li>
                              <li>2. Generate an "App Password" (not your regular password)</li>
                              <li>3. Use the App Password in the password field below</li>
                            </ol>
                            <Button 
                              type="button" 
                              variant="link" 
                              className="p-0 h-auto mt-2"
                              onClick={() => window.open("https://support.google.com/accounts/answer/185833", "_blank")}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Gmail App Password Guide
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* SMTP Host */}
                        <FormField
                          control={form.control}
                          name="emailHost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Host</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="smtp.gmail.com" 
                                  {...field}
                                  disabled={emailService === "gmail"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* SMTP Port */}
                        <FormField
                          control={form.control}
                          name="emailPort"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Port</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="587" 
                                  {...field}
                                  disabled={emailService === "gmail"}
                                />
                              </FormControl>
                              <FormDescription>
                                587 for TLS, 465 for SSL
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Email User */}
                        <FormField
                          control={form.control}
                          name="emailUser"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email"
                                  placeholder="your.email@gmail.com" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Email Password */}
                        <FormField
                          control={form.control}
                          name="emailPass"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {emailService === "gmail" ? "App Password" : "Password"}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="password"
                                  placeholder={emailService === "gmail" ? "16-character app password" : "Your email password"}
                                  {...field}
                                />
                              </FormControl>
                              {emailService === "gmail" && (
                                <FormDescription>
                                  Use your Gmail App Password, not your regular password
                                </FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* From Email */}
                      <FormField
                        control={form.control}
                        name="fromEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sender Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="noreply@hackathonhub.com" 
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This email address will appear as the sender in registration confirmations
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4 pt-4">
                    <Button 
                      type="submit" 
                      disabled={updateEmailSettings.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updateEmailSettings.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                    
                    {form.watch("enableEmails") && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => testEmailConnection.mutate()}
                        disabled={testEmailConnection.isPending}
                      >
                        {testEmailConnection.isPending ? "Testing..." : "Test Connection"}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Email Service</span>
                  <Badge variant={currentSettings?.enableEmails ? "default" : "secondary"}>
                    {currentSettings?.enableEmails ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">SMTP Configuration</span>
                  <Badge variant={currentSettings?.emailHost ? "default" : "destructive"}>
                    {currentSettings?.emailHost ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}