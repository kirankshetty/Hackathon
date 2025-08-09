import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/Sidebar";

const addApplicantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  studentId: z.string().min(1, "Student ID is required"),
  college: z.string().min(1, "College is required"),
  course: z.string().min(1, "Course is required"),
  year: z.string().min(1, "Year of graduation is required"),
  linkedinProfile: z.string().url("Valid LinkedIn URL is required").optional().or(z.literal(""))
});

type AddApplicantFormData = z.infer<typeof addApplicantSchema>;

export default function AddApplicant() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddApplicantFormData>({
    resolver: zodResolver(addApplicantSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      studentId: "",
      college: "",
      course: "",
      year: "",
      linkedinProfile: ""
    },
  });

  const addApplicantMutation = useMutation({
    mutationFn: async (data: AddApplicantFormData) => {
      return await apiRequest("/api/applicants", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Applicant added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applicants"] });
      setLocation("/admin");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add applicant",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddApplicantFormData) => {
    addApplicantMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/quick-actions")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quick Actions
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Add Applicant</h2>
              <p className="text-slate-500 mt-1">Register a new participant manually</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Applicant Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter mobile number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student ID *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter student ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="college"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>College/Institution *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter college name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="course"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course/Program *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Computer Science" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year of Graduation *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select graduation year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2026">2026</SelectItem>
                              <SelectItem value="2027">2027</SelectItem>
                              <SelectItem value="2028">2028</SelectItem>
                              <SelectItem value="2029">2029</SelectItem>
                              <SelectItem value="2030">2030</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="linkedinProfile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn Profile (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/quick-actions")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addApplicantMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {addApplicantMutation.isPending ? "Adding..." : "Add Applicant"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}