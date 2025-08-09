import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const editApplicantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  studentId: z.string().min(1, "Student ID is required"),
  collegeName: z.string().min(1, "College name is required"),
  course: z.string().min(1, "Course is required"),
  yearOfGraduation: z.string().min(1, "Year of graduation is required"),
  linkedinProfile: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  status: z.enum(["registered", "submitted", "selected", "not_selected", "won"]),
});

type EditApplicantForm = z.infer<typeof editApplicantSchema>;

interface EditApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: any;
  onUpdate: (id: string, updates: any) => void;
  isLoading?: boolean;
}

export default function EditApplicantModal({
  isOpen,
  onClose,
  applicant,
  onUpdate,
  isLoading = false,
}: EditApplicantModalProps) {
  const form = useForm<EditApplicantForm>({
    resolver: zodResolver(editApplicantSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      studentId: "",
      collegeName: "",
      course: "",
      yearOfGraduation: "",
      linkedinProfile: "",
      status: "registered",
    },
  });

  // Update form values when applicant changes
  useEffect(() => {
    if (applicant) {
      form.reset({
        name: applicant.name || "",
        email: applicant.email || "",
        mobile: applicant.mobile || "",
        studentId: applicant.studentId || "",
        collegeName: applicant.collegeName || "",
        course: applicant.course || "",
        yearOfGraduation: applicant.yearOfGraduation || "",
        linkedinProfile: applicant.linkedinProfile || "",
        status: applicant.status || "registered",
      });
    }
  }, [applicant, form]);

  const onSubmit = (data: EditApplicantForm) => {
    onUpdate(applicant.id, data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Applicant</DialogTitle>
          <DialogDescription>
            Update applicant information and status
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter full name" />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Enter email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter mobile number" />
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
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter student ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="collegeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>College/University</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter college name" />
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
                    <FormLabel>Course/Program</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter course" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="yearOfGraduation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year of Graduation</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select graduation year" />
                      </SelectTrigger>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedinProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://linkedin.com/in/username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registered">Registered</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="selected">Selected</SelectItem>
                        <SelectItem value="not_selected">Not Selected</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Applicant"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}