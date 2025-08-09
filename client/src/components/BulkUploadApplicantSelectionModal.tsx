import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { X, Download, Upload, FileSpreadsheet } from "lucide-react";

interface BulkUploadApplicantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkUploadApplicantSelectionModal({ isOpen, onClose }: BulkUploadApplicantSelectionModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/applicant-selection/template');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'applicant-selection-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Template Downloaded",
        description: "Applicant selection template has been downloaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/applicant-selection/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `${data.updated || 0} applicant selection details have been updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applicants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      setSelectedFile(null);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please check the format and try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel (.xlsx, .xls) or CSV file.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(selectedFile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Upload Applicant Selection</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download Section */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Download Template</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Use our template to ensure proper data format. The template includes columns for:
                  ApplicantID, RegistrationID, Current Stage, Status (Selected/Not Selected), Next Stage
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplateMutation.mutate()}
                  disabled={downloadTemplateMutation.isPending}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadTemplateMutation.isPending ? 'Downloading...' : 'Download Template'}
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <Label htmlFor="file-upload" className="text-base font-medium">
              Upload Excel File
            </Label>
            <div className="mt-2">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-sm text-slate-500 mt-1">
                Upload an Excel file with applicant selection data. Maximum file size: 10MB
              </p>
            </div>
            
            {selectedFile && (
              <div className="mt-2 p-2 bg-slate-50 rounded border">
                <p className="text-sm text-slate-700">
                  Selected: <span className="font-medium">{selectedFile.name}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="min-w-[100px]"
            >
              {uploadMutation.isPending ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}