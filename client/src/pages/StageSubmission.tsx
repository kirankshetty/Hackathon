import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { 
  Github, 
  FileText, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Download,
  ExternalLink,
  Loader2
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  fileUrl?: string;
  fileType: string;
  isRequired: boolean;
  isActive: boolean;
  stageId: string;
}

interface StageData {
  id: string;
  name: string;
  description: string;
  endTime: string;
  status: string;
  requirements?: Array<{
    description: string;
    template: string;
  }>;
}

export default function StageSubmission() {
  const [, params] = useRoute('/applicant/submit/:stageId');
  const stageId = params?.stageId;
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [githubUrl, setGithubUrl] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('applicantToken');
    if (!token) {
      navigate('/applicant/login');
    }
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('applicantToken');
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  // Get stage documents
  const { data: documentsData, isLoading: documentsLoading } = useQuery<{ documents: DocumentTemplate[] }>({
    queryKey: [`/api/applicant/documents/${stageId}`],
    queryFn: async () => {
      return await apiRequest(`/api/applicant/documents/${stageId}`, {
        headers: getAuthHeaders(),
      });
    },
    enabled: !!stageId,
    retry: false,
  });

  // Get competition rounds to find stage info
  const { data: roundsData, isLoading: roundsLoading } = useQuery<{ rounds: StageData[] }>({
    queryKey: ['/api/applicant/rounds'],
    queryFn: async () => {
      return await apiRequest('/api/applicant/rounds', {
        headers: getAuthHeaders(),
      });
    },
    enabled: !!localStorage.getItem('applicantToken'),
    retry: false,
  });

  // Get existing submission
  const { data: submissionsData } = useQuery<{ submissions: any[] }>({
    queryKey: ['/api/applicant/my-submissions'],
    queryFn: async () => {
      return await apiRequest('/api/applicant/my-submissions', {
        headers: getAuthHeaders(),
      });
    },
    retry: false,
  });

  // Find current stage and existing submission
  const currentStage = roundsData?.rounds?.find(r => r.id === stageId);
  const existingSubmission = submissionsData?.submissions?.find(s => s.stageId === stageId);

  // Populate form with existing data
  useEffect(() => {
    if (existingSubmission) {
      setGithubUrl(existingSubmission.githubUrl || '');
      setSelectedDocuments(existingSubmission.documents || []);
    }
  }, [existingSubmission]);

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const submitMutation = useMutation({
    mutationFn: async (submissionData: { stageId: string; githubUrl: string; documents: any[] }) => {
      return await apiRequest('/api/applicant/submit-stage', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(submissionData),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Submission Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applicant/my-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applicant/dashboard'] });
      navigate('/applicant/submissions');
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to submit";
      
      if (error.message?.includes('403') || error.message?.includes('not eligible')) {
        // Handle eligibility error
        toast({
          title: "Submission Not Allowed", 
          description: error.message?.includes('must be selected') 
            ? "You are not eligible to submit for this stage. You must be selected for the hackathon first."
            : "You are not eligible to submit for this stage at this time.",
          variant: "destructive",
        });
      } else if (error.message?.includes('404') || error.message?.includes('not found')) {
        // Handle stage not found
        toast({
          title: "Stage Not Found",
          description: "The requested stage could not be found or is no longer available.",
          variant: "destructive",
        });
        navigate('/applicant/dashboard');
      } else {
        // Generic error
        toast({
          title: "Submission Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!stageId) {
      toast({
        title: "Error",
        description: "Stage ID is missing",
        variant: "destructive",
      });
      return;
    }

    if (!githubUrl.trim()) {
      toast({
        title: "Error",
        description: "GitHub repository URL is required",
        variant: "destructive",
      });
      return;
    }

    // Validate GitHub URL format
    const githubUrlPattern = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/;
    if (!githubUrlPattern.test(githubUrl.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      stageId,
      githubUrl: githubUrl.trim(),
      documents: selectedDocuments
    });
  };

  if (documentsLoading || roundsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentStage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Stage Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested stage could not be found or is not available.
          </p>
          <Button onClick={() => navigate('/applicant/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isStageExpired = new Date(currentStage.endTime) < new Date();
  const isStageActive = currentStage.status === 'active';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/applicant/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentStage.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Submit your work for this stage
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Stage Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Stage Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {currentStage.description}
                </p>
                
                {/* Stage Requirements */}
                {currentStage.requirements && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Stage Requirements:</h4>
                      {/* Show download button if document templates exist */}
                      {(documentsData?.documents && documentsData.documents.some(doc => doc.fileUrl)) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Download all available templates from document templates system
                            if (documentsData?.documents && documentsData.documents.length > 0) {
                              const templatesWithUrls = documentsData.documents.filter(doc => doc.fileUrl);
                              
                              if (templatesWithUrls.length > 0) {
                                templatesWithUrls.forEach(doc => {
                                  // Create a temporary link to download the template
                                  const link = document.createElement('a');
                                  link.href = doc.fileUrl;
                                  link.download = doc.name || 'template';
                                  link.target = '_blank';
                                  link.rel = 'noopener noreferrer';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                });
                                
                                toast({
                                  title: "Templates Downloaded",
                                  description: `${templatesWithUrls.length} template file(s) have been downloaded`,
                                });
                              } else {
                                toast({
                                  title: "No Templates Available",
                                  description: "No template files are available for download",
                                  variant: "destructive"
                                });
                              }
                            } else {
                              toast({
                                title: "No Templates Available", 
                                description: "No template files are configured for this stage",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="text-blue-600 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/50"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Templates
                        </Button>
                      )}
                    </div>
                    {Array.isArray(currentStage.requirements) ? (
                      <div className="space-y-2">
                        {currentStage.requirements.map((req: any, index: number) => (
                          <div key={index} className="p-2 bg-blue-100 dark:bg-blue-800/20 rounded">
                            <span className="text-sm text-blue-800 dark:text-blue-200">
                              {typeof req === 'string' ? req : req.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : typeof currentStage.requirements === 'object' && currentStage.requirements.description ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          {currentStage.requirements.template && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(currentStage.requirements.template, '_blank')}
                              className="text-blue-600 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/50"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Template
                            </Button>
                          )}
                        </div>
                        <div className="p-2 bg-blue-100 dark:bg-blue-800/20 rounded">
                          <span className="text-sm text-blue-800 dark:text-blue-200">
                            {currentStage.requirements.description}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">Submission Deadline</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(currentStage.endTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {isStageExpired ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Expired
                      </span>
                    ) : isStageActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {(isStageExpired || !isStageActive) && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          {isStageExpired ? 'Stage Expired' : 'Stage Inactive'}
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                          {isStageExpired 
                            ? 'This stage has expired and no longer accepts submissions.'
                            : 'This stage is not currently active for submissions.'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* GitHub Repository Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Github className="w-5 h-5 mr-2" />
                GitHub Repository
              </CardTitle>
              <CardDescription>
                Provide your project's GitHub repository URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="githubUrl">
                  GitHub Repository URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={submitMutation.isPending || (isStageExpired || !isStageActive)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Make sure your repository is public and contains your project files
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Document Templates */}
          {documentsData?.documents && documentsData.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Document Templates</CardTitle>
                <CardDescription>
                  Review requirements and select the documents you are submitting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentsData.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-3 flex-1">
                        <Checkbox
                          id={`doc-${doc.id}`}
                          checked={selectedDocuments.includes(doc.id)}
                          onCheckedChange={() => handleDocumentToggle(doc.id)}
                          disabled={isStageExpired || !isStageActive}
                        />
                        <div className="flex-1">
                          <label htmlFor={`doc-${doc.id}`} className="font-medium cursor-pointer">
                            {doc.name}
                          </label>
                          {doc.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {doc.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            {doc.isRequired && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                Required
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                              {doc.fileType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {existingSubmission ? 'Update Submission' : 'Confirm Submission'}
              </CardTitle>
              <CardDescription>
                {existingSubmission 
                  ? 'Update your existing submission'
                  : 'Review and confirm your submission details'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Document Selection Summary */}
                {documentsData?.documents && documentsData.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label>Documents Selected for Submission</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {selectedDocuments.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No documents selected yet. Please select the documents you are submitting above.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {selectedDocuments.map(docId => {
                            const doc = documentsData.documents.find(d => d.id === docId);
                            return doc ? (
                              <div key={docId} className="flex items-center text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                {doc.name}
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Select the documents above that you are including in your submission
                    </p>
                  </div>
                )}

                {existingSubmission && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Existing Submission Found
                        </h3>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                          You have already submitted for this stage. Submitting again will update your existing submission.
                        </p>
                        {existingSubmission.submittedAt && (
                          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                            Last submitted: {new Date(existingSubmission.submittedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending || (isStageExpired || !isStageActive)}
                    className="flex-1"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {existingSubmission ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Github className="mr-2 h-4 w-4" />
                        {existingSubmission ? 'Update Submission' : 'Confirm Submission'}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/applicant/submissions')}
                  >
                    View All Submissions
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}