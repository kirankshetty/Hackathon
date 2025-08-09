import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BulkUploadStageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkUploadStageModal({ isOpen, onClose }: BulkUploadStageModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stage-details/template');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'stage-details-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Template Downloaded",
        description: "Stage details template has been downloaded successfully.",
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
      
      const response = await fetch('/api/stage-details/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Stage details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
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
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an Excel (.xlsx, .xls) or CSV file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 10MB.",
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

  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Upload Stage Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                Upload an Excel file with stage data. Maximum file size: 10MB
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

          {/* Download Template Section */}
          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={downloadTemplateMutation.isPending}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadTemplateMutation.isPending ? 'Downloading...' : 'Download Template'}
            </Button>
            <p className="text-sm text-slate-500 mt-2">
              Get the Excel template with required columns: Stage Name, Total Participants, 
              Total Colleges, Ideas Submitted, Prototypes Approved, Projects Approved, 
              Total Invitees, Solutions to be Built
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}