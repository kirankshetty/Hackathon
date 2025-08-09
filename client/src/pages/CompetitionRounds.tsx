import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trophy, Clock, Users, Calendar, Edit, Trash2, MoreVertical, X, FileText, Upload, Trash } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { RequirementsEditor } from "@/components/RequirementsEditor";
import Sidebar from "@/components/Sidebar";

const addRoundSchema = z.object({
  name: z.string().min(1, "Round name is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["upcoming", "active", "completed"]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxParticipants: z.string().optional(),
  requirements: z.array(z.object({
    description: z.string().min(1, "Requirement description is required"),
    template: z.string().optional()
  })).min(1, "At least one requirement is required"),
  prizes: z.string().optional(),
});

type AddRoundFormData = z.infer<typeof addRoundSchema>;

export default function CompetitionRounds() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<any>(null);
  const [requirements, setRequirements] = useState([{ description: "", template: "" }]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roundsData, isLoading } = useQuery({
    queryKey: ["/api/rounds"],
  });

  const rounds = (roundsData as any)?.rounds || [];

  const form = useForm<AddRoundFormData>({
    resolver: zodResolver(addRoundSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "upcoming",
      startTime: "",
      endTime: "",
      maxParticipants: "",
      requirements: [{ description: "", template: "" }],
      prizes: "",
    },
  });

  const createRoundMutation = useMutation({
    mutationFn: async (data: AddRoundFormData) => {
      const roundData = {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        requirements: data.requirements.filter(req => req.description.trim()),
        prizes: data.prizes ? data.prizes.split('\n').filter(p => p.trim()) : [],
        currentParticipants: "0",
      };
      return await apiRequest("/api/rounds", {
        method: "POST",
        body: JSON.stringify(roundData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Competition round added successfully",
      });
    },
    onError: (error) => {
      console.error("Create round error:", error);
      if (isUnauthorizedError(error as Error)) {
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
        description: error instanceof Error ? error.message : "Failed to add competition round",
        variant: "destructive",
      });
    },
  });

  const updateRoundMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddRoundFormData }) => {
      const roundData = {
        ...data,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        requirements: data.requirements.filter(req => req.description.trim()),
        prizes: data.prizes ? data.prizes.split('\n').filter(p => p.trim()) : [],
      };
      return await apiRequest(`/api/rounds/${id}`, {
        method: "PUT",
        body: JSON.stringify(roundData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      setIsEditDialogOpen(false);
      setSelectedRound(null);
      form.reset();
      toast({
        title: "Success",
        description: "Competition round updated successfully",
      });
    },
    onError: (error) => {
      console.error("Update round error:", error);
      if (isUnauthorizedError(error as Error)) {
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
        description: error instanceof Error ? error.message : "Failed to update competition round",
        variant: "destructive",
      });
    },
  });

  const deleteRoundMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/rounds/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      setIsDeleteDialogOpen(false);
      setSelectedRound(null);
      toast({
        title: "Success",
        description: "Competition round deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete round error:", error);
      if (isUnauthorizedError(error as Error)) {
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
        description: error instanceof Error ? error.message : "Failed to delete competition round",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddRoundFormData) => {
    console.log("Form data:", data);
    if (selectedRound) {
      updateRoundMutation.mutate({ id: selectedRound.id, data });
    } else {
      createRoundMutation.mutate(data);
    }
  };

  const addRequirement = () => {
    const currentRequirements = form.getValues("requirements");
    const newRequirements = [...currentRequirements, { description: "", template: "" }];
    form.setValue("requirements", newRequirements);
    setRequirements(newRequirements);
  };

  const removeRequirement = (index: number) => {
    const currentRequirements = form.getValues("requirements");
    if (currentRequirements.length > 1) {
      const newRequirements = currentRequirements.filter((_, i) => i !== index);
      form.setValue("requirements", newRequirements);
      setRequirements(newRequirements);
    }
  };

  const updateRequirement = (index: number, field: 'description' | 'template', value: string) => {
    const currentRequirements = form.getValues("requirements");
    const newRequirements = [...currentRequirements];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    form.setValue("requirements", newRequirements);
    setRequirements(newRequirements);
  };



  const handleEditRound = (round: any) => {
    setSelectedRound(round);
    
    // Convert existing requirements to new format
    let editRequirements = [{ description: "", template: "" }];
    if (round.requirements) {
      if (Array.isArray(round.requirements)) {
        // Handle array format (existing data)
        editRequirements = round.requirements.map((req: any) => ({
          description: typeof req === 'string' ? req : req.description || "",
          template: typeof req === 'object' ? req.template || "" : ""
        }));
      } else if (typeof round.requirements === 'object') {
        // Handle new object format
        if (round.requirements.description) {
          editRequirements = [{
            description: round.requirements.description,
            template: round.requirements.template || ""
          }];
        }
      }
    }
    
    form.reset({
      name: round.name,
      description: round.description,
      status: round.status,
      startTime: round.startTime ? new Date(round.startTime).toISOString().slice(0, 16) : "",
      endTime: round.endTime ? new Date(round.endTime).toISOString().slice(0, 16) : "",
      maxParticipants: round.maxParticipants || "",
      requirements: editRequirements,
      prizes: round.prizes ? round.prizes.join('\n') : "",
    });
    setRequirements(editRequirements);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRound = (round: any) => {
    setSelectedRound(round);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRound) {
      deleteRoundMutation.mutate(selectedRound.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming": return <Clock className="w-4 h-4" />;
      case "active": return <Trophy className="w-4 h-4" />;
      case "completed": return <Trophy className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar userRole="admin" />
        <div className="flex-1 ml-64 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar userRole="admin" />
      <div className="flex-1 ml-64 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Competition Rounds</h1>
          <p className="text-slate-600 mt-2">Manage hackathon competition stages and rounds</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (open) {
            setRequirements([{ description: "", template: "" }]);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Round
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add Competition Round</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="add-round-form">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Round Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Preliminary Round" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the round objectives and activities..."
                            {...field}
                          />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time (Optional)</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time (Optional)</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Participants (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  <RequirementsEditor
                    requirements={requirements}
                    onUpdate={(newReqs) => {
                      setRequirements(newReqs);
                      form.setValue("requirements", newReqs);
                    }}
                    formId="add"
                  />

                  <FormField
                    control={form.control}
                    name="prizes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prizes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter each prize on a new line..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </form>
              </Form>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t mt-4 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="add-round-form"
                disabled={createRoundMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createRoundMutation.isPending ? "Adding..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Edit Competition Round</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="edit-round-form">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Round Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Preliminary Round" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the round objectives and activities..."
                            {...field}
                          />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time (Optional)</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time (Optional)</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Participants (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <RequirementsEditor
                      requirements={requirements}
                      onUpdate={(newReqs) => {
                        setRequirements(newReqs);
                        form.setValue("requirements", newReqs);
                      }}
                      formId="edit"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="prizes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prizes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter each prize on a new line..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t mt-4 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedRound(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="edit-round-form"
                disabled={updateRoundMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateRoundMutation.isPending ? "Updating..." : "Update Round"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Competition Round</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedRound?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedRound(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteRoundMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteRoundMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {rounds.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Competition Rounds</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first competition round.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Round
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rounds.map((round: any) => (
            <Card key={round.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{round.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(round.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(round.status)}
                        <span className="capitalize">{round.status}</span>
                      </div>
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRound(round)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRound(round)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{round.description}</p>
                
                {round.startTime && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(round.startTime).toLocaleDateString()}
                  </div>
                )}
                
                {round.maxParticipants && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    Max: {round.maxParticipants} participants
                  </div>
                )}

                {round.requirements && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
                    {Array.isArray(round.requirements) ? (
                      <div className="space-y-2">
                        {round.requirements.slice(0, 3).map((req: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm text-gray-600 p-2 bg-gray-50 rounded">
                            <span className="flex-1 mr-2">
                              {typeof req === 'string' ? req : req.description}
                            </span>
                            {typeof req === 'object' && req.template && (
                              <a 
                                href={req.template} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs underline flex items-center"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Template
                              </a>
                            )}
                          </div>
                        ))}
                        {round.requirements.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{round.requirements.length - 3} more requirements
                          </p>
                        )}
                      </div>
                    ) : typeof round.requirements === 'object' && round.requirements.description ? (
                      <div className="flex items-center justify-between text-sm text-gray-600 p-2 bg-gray-50 rounded">
                        <span className="flex-1 mr-2">{round.requirements.description}</span>
                        {round.requirements.template && (
                          <a 
                            href={round.requirements.template} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs underline flex items-center"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Template
                          </a>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {round.prizes && round.prizes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Prizes:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {round.prizes.slice(0, 2).map((prize: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <Trophy className="w-3 h-3 text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                          {prize}
                        </li>
                      ))}
                      {round.prizes.length > 2 && (
                        <li className="text-xs text-gray-500">
                          +{round.prizes.length - 2} more prizes
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}