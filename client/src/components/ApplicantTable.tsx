import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, ArrowUp, X, Github, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import EditApplicantModal from "./EditApplicantModal";

interface ApplicantTableProps {
  userRole: 'admin' | 'jury';
}

export default function ApplicantTable({ userRole }: ApplicantTableProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editingApplicant, setEditingApplicant] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const limit = 10;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (statusFilter && statusFilter !== "all") queryParams.append('status', statusFilter);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  
  const { data, isLoading } = useQuery({
    queryKey: [`/api/applicants?${queryParams.toString()}`],
  });

  const selectMutation = useMutation({
    mutationFn: async (applicantId: string) => {
      return await apiRequest(`/api/applicants/${applicantId}/select`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Applicant selected successfully. Email notification sent.",
      });
      queryClient.invalidateQueries({ predicate: (query) => 
        !!query.queryKey[0]?.toString().startsWith('/api/applicants')
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest(`/api/applicants/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Applicant updated successfully.",
      });
      queryClient.invalidateQueries({ predicate: (query) => 
        !!query.queryKey[0]?.toString().startsWith('/api/applicants')
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (applicantId: string) => {
      return await apiRequest(`/api/applicants/${applicantId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Applicant deleted successfully.",
      });
      queryClient.invalidateQueries({ predicate: (query) => 
        !!query.queryKey[0]?.toString().startsWith('/api/applicants')
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-cyan-100 text-cyan-800';
      case 'selected': return 'bg-emerald-100 text-emerald-800';
      case 'not_selected': return 'bg-red-100 text-red-800';
      case 'won': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'round1': return 'bg-orange-100 text-orange-800';
      case 'round2': return 'bg-purple-100 text-purple-800';
      case 'round3': return 'bg-violet-100 text-violet-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'registered': return 'Registered';
      case 'submitted': return 'Submitted';
      case 'selected': return 'Selected';
      case 'not_selected': return 'Not Selected';
      case 'won': return 'Won';
      case 'confirmed': return 'Confirmed';
      case 'round1': return 'Round 1';
      case 'round2': return 'Round 2';
      case 'round3': return 'Round 3';
      default: return status?.replace('_', ' ').toUpperCase() || 'Unknown';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handlePromote = (applicantId: string, currentStatus: string) => {
    const statusProgression: { [key: string]: string } = {
      'confirmed': 'round1',
      'round1': 'round2',
      'round2': 'round3',
      'round3': 'finalist',
    };

    const nextStatus = statusProgression[currentStatus];
    if (nextStatus) {
      updateMutation.mutate({
        id: applicantId,
        updates: { status: nextStatus }
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const applicants = (data as any)?.applicants || [];
  const total = (data as any)?.total || 0;
  const totalPages = (data as any)?.totalPages || 1;

  return (
    <>
      <Card>
        <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {userRole === 'jury' ? 'Submissions for Review' : 'Recent Applicants'}
          </CardTitle>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                placeholder="Search applicants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="not_selected">Not Selected</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="round1">Round 1</SelectItem>
                <SelectItem value="round2">Round 2</SelectItem>
                <SelectItem value="round3">Final Round</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Registration ID
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  College
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Current Stage
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {applicants.map((applicant: any) => (
                <tr key={applicant.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {getInitials(applicant.name)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{applicant.name}</div>
                        <div className="text-sm text-slate-500">{applicant.mobile}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-mono">
                    {applicant.registrationId}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {applicant.collegeName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {applicant.githubUrl ? (
                      applicant.currentStage || 'Stage 1'
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getStatusColor(applicant.status)} whitespace-nowrap`}>
                      {getStatusDisplay(applicant.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {userRole === 'jury' && applicant.status === 'submitted' && (
                        <Button
                          size="sm"
                          onClick={() => selectMutation.mutate(applicant.id)}
                          disabled={selectMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Select
                        </Button>
                      )}
                      
                      {userRole === 'admin' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit applicant"
                            onClick={() => {
                              setEditingApplicant(applicant);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete applicant"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${applicant.name}? This action cannot be undone.`)) {
                                deleteMutation.mutate(applicant.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-900 mx-1">
              {((page - 1) * limit) + 1} to {Math.min(page * limit, total)}
            </span>{" "}
            of <span className="font-medium text-slate-900 mx-1">{total}</span> results
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            
            <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
              {page}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <EditApplicantModal
      isOpen={isEditModalOpen}
      onClose={() => {
        setIsEditModalOpen(false);
        setEditingApplicant(null);
      }}
      applicant={editingApplicant}
      onUpdate={(id, updates) => {
        updateMutation.mutate({ id, updates });
      }}
      isLoading={updateMutation.isPending}
    />
    </>
  );
}
