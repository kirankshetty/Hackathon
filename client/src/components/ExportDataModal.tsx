import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'applicants' | 'rounds' | null;
}

export default function ExportDataModal({ isOpen, onClose, exportType }: ExportDataModalProps) {
  const [filters, setFilters] = useState({
    fromDate: "",
    fromTime: "09:00",
    toDate: "",
    toTime: "18:00",
    collegeName: "",
    status: "",
    registrationCode: "",
  });

  const [roundFilters, setRoundFilters] = useState({
    fromDate: "",
    toDate: "",
    stageName: "",
  });

  const [selectedMetrics, setSelectedMetrics] = useState({
    totalParticipants: false,
    totalColleges: false,
    ideasSubmitted: false,
    prototypesApproved: false,
    projectsApproved: false,
    totalInvitees: false,
    solutionsToBeBuilt: false,
  });

  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (exportData: any) => {
      const endpoint = exportType === 'applicants' 
        ? "/api/admin/export-applicants" 
        : "/api/admin/export-rounds";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition 
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : exportType === 'applicants' ? "applicants_export.csv" : "rounds_export.xlsx";

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: exportType === 'applicants' 
          ? "Applicants data has been exported successfully." 
          : "Competition round details have been exported successfully.",
      });
      onClose();
      setFilters({
        fromDate: "",
        fromTime: "09:00",
        toDate: "",
        toTime: "18:00",
        collegeName: "",
        status: "",
        registrationCode: "",
      });
      setRoundFilters({
        fromDate: "",
        toDate: "",
        stageName: "",
      });
      setSelectedMetrics({
        totalParticipants: false,
        totalColleges: false,
        ideasSubmitted: false,
        prototypesApproved: false,
        projectsApproved: false,
        totalInvitees: false,
        solutionsToBeBuilt: false,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || (exportType === 'applicants' 
          ? "Failed to export applicants data." 
          : "Failed to export competition round details."),
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    if (exportType === 'applicants') {
      const exportFilters: any = {};

      // Combine date and time for from and to filters
      if (filters.fromDate && filters.fromTime) {
        exportFilters.fromDateTime = `${filters.fromDate}T${filters.fromTime}:00.000Z`;
      }
      if (filters.toDate && filters.toTime) {
        exportFilters.toDateTime = `${filters.toDate}T${filters.toTime}:00.000Z`;
      }

      // Add other filters if they have values
      if (filters.collegeName.trim()) {
        exportFilters.collegeName = filters.collegeName.trim();
      }
      if (filters.status && filters.status !== "all") {
        exportFilters.status = filters.status;
      }
      if (filters.registrationCode.trim()) {
        exportFilters.registrationCode = filters.registrationCode.trim();
      }

      exportMutation.mutate(exportFilters);
    } else if (exportType === 'rounds') {
      const exportData: any = {
        filters: roundFilters,
        metrics: selectedMetrics,
      };

      exportMutation.mutate(exportData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {exportType === 'applicants' ? 'Export Applicants Data' : 
             exportType === 'rounds' ? 'Export Competition Round Details' : 
             'Export Data'}
          </DialogTitle>
          <DialogDescription>
            {exportType === 'applicants' 
              ? 'Set filters to export specific applicant data. Leave fields empty to include all data.'
              : exportType === 'rounds' 
              ? 'Export competition round configurations and statistics.'
              : 'Choose the type of data to export.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {exportType === 'applicants' && (
            <>
              {/* Date and Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromTime">From Time</Label>
                  <Input
                    id="fromTime"
                    type="time"
                    value={filters.fromTime}
                    onChange={(e) => setFilters({ ...filters, fromTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toTime">To Time</Label>
                  <Input
                    id="toTime"
                    type="time"
                    value={filters.toTime}
                    onChange={(e) => setFilters({ ...filters, toTime: e.target.value })}
                  />
                </div>
              </div>

              {/* College Name */}
              <div className="space-y-2">
                <Label htmlFor="collegeName">College Name</Label>
                <Input
                  id="collegeName"
                  placeholder="Enter college name (partial match)"
                  value={filters.collegeName}
                  onChange={(e) => setFilters({ ...filters, collegeName: e.target.value })}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="selected">Selected</SelectItem>
                    <SelectItem value="not_selected">Not Selected</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Registration Code */}
          {exportType === 'applicants' && (
            <div className="space-y-2">
              <Label htmlFor="registrationCode">Registration Code</Label>
              <Input
                id="registrationCode"
                placeholder="Enter registration code"
                value={filters.registrationCode}
                onChange={(e) => setFilters({ ...filters, registrationCode: e.target.value })}
              />
            </div>
          )}

          {exportType === 'rounds' && (
            <>
              {/* Date Range for Rounds */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roundFromDate">From Date</Label>
                  <Input
                    id="roundFromDate"
                    type="date"
                    value={roundFilters.fromDate}
                    onChange={(e) => setRoundFilters({ ...roundFilters, fromDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roundToDate">To Date</Label>
                  <Input
                    id="roundToDate"
                    type="date"
                    value={roundFilters.toDate}
                    onChange={(e) => setRoundFilters({ ...roundFilters, toDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Stage Name Filter */}
              <div className="space-y-2">
                <Label htmlFor="stageName">Stage Name</Label>
                <Select
                  value={roundFilters.stageName}
                  onValueChange={(value) => setRoundFilters({ ...roundFilters, stageName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="stage1">Stage 1 - Preliminary Ideas Submission Round</SelectItem>
                    <SelectItem value="stage2">Stage 2 - Prototype Submission and Selection Round</SelectItem>
                    <SelectItem value="stage3">Stage 3 - Project Submission and Selection Round</SelectItem>
                    <SelectItem value="stage4">Stage 4 - Change Makers and Innovators</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Metrics Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Select Metrics to Export</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="totalParticipants"
                      checked={selectedMetrics.totalParticipants}
                      onCheckedChange={(checked) => 
                        setSelectedMetrics({ ...selectedMetrics, totalParticipants: !!checked })
                      }
                    />
                    <Label htmlFor="totalParticipants" className="text-sm">Total Participants</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="totalColleges"
                      checked={selectedMetrics.totalColleges}
                      onCheckedChange={(checked) => 
                        setSelectedMetrics({ ...selectedMetrics, totalColleges: !!checked })
                      }
                    />
                    <Label htmlFor="totalColleges" className="text-sm">Total Colleges</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ideasSubmitted"
                      checked={selectedMetrics.ideasSubmitted}
                      onCheckedChange={(checked) => 
                        setSelectedMetrics({ ...selectedMetrics, ideasSubmitted: !!checked })
                      }
                    />
                    <Label htmlFor="ideasSubmitted" className="text-sm">Ideas Submitted</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prototypesApproved"
                      checked={selectedMetrics.prototypesApproved}
                      onCheckedChange={(checked) => 
                        setSelectedMetrics({ ...selectedMetrics, prototypesApproved: !!checked })
                      }
                    />
                    <Label htmlFor="prototypesApproved" className="text-sm">Prototypes Approved</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="projectsApproved"
                      checked={selectedMetrics.projectsApproved}
                      onCheckedChange={(checked) => 
                        setSelectedMetrics({ ...selectedMetrics, projectsApproved: !!checked })
                      }
                    />
                    <Label htmlFor="projectsApproved" className="text-sm">Projects Approved</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="totalInvitees"
                      checked={selectedMetrics.totalInvitees}
                      onCheckedChange={(checked) => 
                        setSelectedMetrics({ ...selectedMetrics, totalInvitees: !!checked })
                      }
                    />
                    <Label htmlFor="totalInvitees" className="text-sm">Total Invitees</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="solutionsToBeBuilt"
                      checked={selectedMetrics.solutionsToBeBuilt}
                      onCheckedChange={(checked) => 
                        setSelectedMetrics({ ...selectedMetrics, solutionsToBeBuilt: !!checked })
                      }
                    />
                    <Label htmlFor="solutionsToBeBuilt" className="text-sm">Solutions to be Built</Label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {exportMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}