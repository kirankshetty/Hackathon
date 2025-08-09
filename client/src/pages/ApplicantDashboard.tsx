import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Github, 
  Calendar,
  User,
  Mail,
  Phone,
  School,
  Award,
  AlertCircle,
  LogOut,
  ExternalLink,
  Lock
} from "lucide-react";
import { useEffect } from "react";

interface DashboardData {
  applicant: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    studentId: string;
    course: string;
    yearOfGraduation: string;
    collegeName: string;
    linkedinProfile?: string;
    status: string;
    registrationId: string;
    confirmedAt?: string;
  };
  progress: Array<{
    id: string;
    stage: string;
    status: string;
    description: string;
    completedAt?: string;
    createdAt: string;
  }>;
  activeRounds: Array<{
    id: string;
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    status: string;
  }>;
  submissions: Array<{
    id: string;
    stageId: string;
    githubUrl?: string;
    documents: any[];
    status: string;
    submittedAt?: string;
  }>;
  currentStatus: string;
  requiresConfirmation: boolean;
}

export default function ApplicantDashboard() {
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

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/applicant/dashboard'],
    queryFn: async () => {
      return await apiRequest('/api/applicant/dashboard', {
        headers: getAuthHeaders(),
      });
    },
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const confirmParticipationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/applicant/confirm-participation', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Participation Confirmed",
        description: "Thank you for confirming your participation!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applicant/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm participation",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/applicant/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      localStorage.removeItem('applicantToken');
      localStorage.removeItem('applicantData');
      navigate('/applicant/login');
    },
    onError: () => {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('applicantToken');
      localStorage.removeItem('applicantData');
      navigate('/applicant/login');
    },
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

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please try refreshing the page or contact support.
          </p>
          <Button onClick={() => navigate('/applicant/login')}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'submitted': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      case 'selected': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'not_selected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'won': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'round1': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'round2': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'round3': return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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

  const getProgressPercentage = () => {
    const stages = ['registered', 'selected', 'confirmed', 'submitted', 'reviewed'];
    const currentIndex = stages.indexOf(dashboardData.currentStatus);
    return currentIndex >= 0 ? ((currentIndex + 1) / stages.length) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Applicant Portal
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Welcome back, {dashboardData.applicant.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(dashboardData.currentStatus)}>
                {getStatusDisplay(dashboardData.currentStatus)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Confirmation Alert */}
            {dashboardData.requiresConfirmation && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-green-800 dark:text-green-300 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Congratulations! You've been selected
                  </CardTitle>
                  <CardDescription className="text-green-700 dark:text-green-400">
                    Please confirm your participation to proceed to the next stage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => confirmParticipationMutation.mutate()}
                    disabled={confirmParticipationMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {confirmParticipationMutation.isPending ? 'Confirming...' : 'Confirm Participation'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Application Progress</CardTitle>
                <CardDescription>
                  Track your journey through the hackathon stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(getProgressPercentage())}%
                    </span>
                  </div>
                  <Progress value={getProgressPercentage()} className="w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Active Rounds */}
            {dashboardData.activeRounds.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Available Stages</CardTitle>
                  <CardDescription>
                    {dashboardData.activeRounds.length === 1 && !['selected', 'confirmed', 'submitted'].includes(dashboardData.currentStatus)
                      ? 'First stage available for all participants' 
                      : 'Stages available for submission based on your progress'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activeRounds.map((round, index) => {
                      const isFirstRound = index === 0;
                      const isUnlocked = isFirstRound || ['selected', 'confirmed', 'submitted'].includes(dashboardData.currentStatus);
                      
                      return (
                        <div key={round.id} className={`border rounded-lg p-4 ${!isUnlocked ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <h3 className="font-semibold">{round.name}</h3>
                              {isFirstRound && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Open to All
                                </Badge>
                              )}
                              {!isFirstRound && isUnlocked && (
                                <Badge variant="default" className="ml-2 text-xs">
                                  Unlocked
                                </Badge>
                              )}
                              {!isFirstRound && !isUnlocked && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Locked
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              Ends: {new Date(round.endTime).toLocaleDateString()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {round.description}
                          </p>
                          
                          {!isFirstRound && !isUnlocked && (
                            <div className="flex items-center text-sm text-amber-600 dark:text-amber-400 mb-3">
                              <Lock className="w-4 h-4 mr-2" />
                              This stage will be available after you are selected for the hackathon
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            onClick={() => navigate(`/applicant/submit/${round.id}`)}
                            disabled={!isUnlocked}
                          >
                            {isUnlocked ? 'Submit for this Stage' : 'Locked - Complete Previous Stage'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Stages</CardTitle>
                  <CardDescription>
                    There are currently no active stages available for submission
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Check back later for upcoming competition stages
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application History */}
            <Card>
              <CardHeader>
                <CardTitle>Application History</CardTitle>
                <CardDescription>
                  Timeline of your application progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.progress.map((item, index) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {item.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.completedAt || item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Registration ID:</span>
                  <div className="font-mono text-blue-600 dark:text-blue-400">
                    {dashboardData.applicant.registrationId}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 mr-2" />
                    {dashboardData.applicant.email}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 mr-2" />
                    {dashboardData.applicant.mobile}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <School className="w-4 h-4 mr-2" />
                    {dashboardData.applicant.collegeName}
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">Course:</span>
                  <div>{dashboardData.applicant.course}</div>
                </div>
                
                {dashboardData.applicant.linkedinProfile && (
                  <div className="text-sm">
                    <a
                      href={dashboardData.applicant.linkedinProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/applicant/submissions')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View My Submissions
                </Button>
                
                {dashboardData.activeRounds.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/applicant/submit/${dashboardData.activeRounds[0].id}`)}
                  >
                    <Github className="w-4 h-4 mr-2" />
                    New Submission
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}