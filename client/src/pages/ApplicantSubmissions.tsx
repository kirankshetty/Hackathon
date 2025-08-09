import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  FileText, 
  Github, 
  Calendar,
  ExternalLink,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock
} from "lucide-react";
import { useEffect } from "react";

interface Submission {
  id: string;
  stageId: string;
  githubUrl?: string;
  documents: any[];
  status: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApplicantSubmissions() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('applicantToken');
    if (!token) {
      navigate('/applicant/login');
    }
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('applicantToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const { data: submissionsData, isLoading, error } = useQuery<{ submissions: Submission[] }>({
    queryKey: ['/api/applicant/my-submissions'],
    queryFn: async () => {
      return await apiRequest('/api/applicant/my-submissions', {
        headers: getAuthHeaders(),
      });
    },
    retry: false,
  });

  // Handle authentication errors
  useEffect(() => {
    if (error && (error as any).message?.includes('401')) {
      localStorage.removeItem('applicantToken');
      localStorage.removeItem('applicantData');
      navigate('/applicant/login');
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'reviewed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'accepted': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'draft':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

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
                  My Submissions
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Track all your stage submissions
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!submissionsData?.submissions?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Submissions Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                You haven't submitted anything yet. When active stages are available, you can submit your work here.
              </p>
              <Button onClick={() => navigate('/applicant/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {submissionsData.submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {getStatusIcon(submission.status)}
                      <span className="ml-2">Stage Submission</span>
                    </CardTitle>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>
                    Stage ID: {submission.stageId}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* GitHub URL */}
                    {submission.githubUrl && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          GitHub Repository
                        </label>
                        <div className="mt-1">
                          <a
                            href={submission.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-500"
                          >
                            <Github className="w-4 h-4 mr-2" />
                            {submission.githubUrl}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {submission.documents && submission.documents.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Submitted Documents
                        </label>
                        <div className="mt-2 space-y-2">
                          {submission.documents.map((doc: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span>{doc.name || `Document ${index + 1}`}</span>
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-500"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Created: {new Date(submission.createdAt).toLocaleString()}
                      </div>
                      {submission.submittedAt && (
                        <div className="flex items-center mt-1 sm:mt-0">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/applicant/submit/${submission.stageId}`)}
                      >
                        View/Edit Submission
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}