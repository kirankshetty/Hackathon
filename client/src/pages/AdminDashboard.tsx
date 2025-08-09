import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import { formatDistanceToNow } from "date-fns";

import RegistrationModal from "@/components/RegistrationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Video, 
  Github, 
  Download, 
  Edit, 
  Trophy,
  Medal,
  Crown
} from "lucide-react";

export default function AdminDashboard() {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const { data: roundsData, isLoading: roundsLoading } = useQuery({
    queryKey: ["/api/rounds"],
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stage-stats"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/recent-activity"],
  });

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
              <p className="text-slate-500 mt-1">Welcome back! Here's what's happening with your hackathon.</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setIsRegistrationModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Registration
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Competition Rounds Sections */}
          {roundsLoading ? (
            <div className="text-center py-8">Loading competition rounds...</div>
          ) : (
            <>
              {(roundsData as any)?.rounds?.map((round: any, roundIndex: number) => (
                <div key={round.id} className="mb-8">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        round.status === 'active' ? 'bg-green-100' :
                        round.status === 'completed' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {roundIndex === 0 ? (
                          <Trophy className={`w-5 h-5 ${
                            round.status === 'active' ? 'text-green-600' :
                            round.status === 'completed' ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        ) : roundIndex === 1 ? (
                          <Medal className={`w-5 h-5 ${
                            round.status === 'active' ? 'text-green-600' :
                            round.status === 'completed' ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        ) : (
                          <Crown className={`w-5 h-5 ${
                            round.status === 'active' ? 'text-green-600' :
                            round.status === 'completed' ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{round.name}</h3>
                        <p className="text-slate-600 text-sm">{round.description}</p>
                      </div>
                    </div>
                    <Badge className={`${
                      round.status === 'active' ? 'bg-green-100 text-green-800' :
                      round.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Three Cards for Each Round */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Total Participants/Invitees */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {round.name.toLowerCase().includes('change makers') || round.name.toLowerCase().includes('innovators') || round.name.toLowerCase().includes('stage 4') ? 'Total Invitees' : 'Total Participants'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-2">
                            {round.name.toLowerCase().includes('change makers') || round.name.toLowerCase().includes('innovators') || round.name.toLowerCase().includes('stage 4') ? 
                              (round.totalInvitees || round.currentParticipants || '0') : 
                              (round.currentParticipants || '0')}
                          </div>
                          <p className="text-slate-600">
                            {round.name.toLowerCase().includes('change makers') || round.name.toLowerCase().includes('innovators') || round.name.toLowerCase().includes('stage 4') ? 'Selected Invitees' : 'Registered Participants'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card 2: Total Colleges */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Total Colleges</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-emerald-600 mb-2">
                            {round.totalColleges || Math.ceil((parseInt(round.currentParticipants) || 0) / 3)}
                          </div>
                          <p className="text-slate-600">Participating Colleges</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card 3: Stage-Specific Metric */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {round.name.toLowerCase().includes('preliminary') || round.name.toLowerCase().includes('stage 1') ? 'Ideas Submitted' :
                           round.name.toLowerCase().includes('prototype') || round.name.toLowerCase().includes('stage 2') ? 'Prototypes Approved' :
                           round.name.toLowerCase().includes('project') || round.name.toLowerCase().includes('stage 3') ? 'Projects Approved' :
                           round.name.toLowerCase().includes('change makers') || round.name.toLowerCase().includes('innovators') || round.name.toLowerCase().includes('stage 4') ? 'Solutions to be Built' :
                           'Submissions'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-2">
                            {round.name.toLowerCase().includes('preliminary') || round.name.toLowerCase().includes('stage 1') ? 
                              (round.ideasSubmitted || round.currentParticipants || 0) :
                             round.name.toLowerCase().includes('prototype') || round.name.toLowerCase().includes('stage 2') ? 
                              (round.prototypesApproved || Math.floor((parseInt(round.currentParticipants) || 0) * 0.7)) :
                             round.name.toLowerCase().includes('project') || round.name.toLowerCase().includes('stage 3') ? 
                              (round.projectsApproved || Math.floor((parseInt(round.currentParticipants) || 0) * 0.5)) :
                             round.name.toLowerCase().includes('change makers') || round.name.toLowerCase().includes('innovators') || round.name.toLowerCase().includes('stage 4') ? 
                              (round.solutionsToBeBuilt || Math.floor((parseInt(round.currentParticipants) || 0) * 0.3)) :
                             (parseInt(round.currentParticipants) || 0)}
                          </div>
                          <p className="text-slate-600">
                            {round.name.toLowerCase().includes('preliminary') || round.name.toLowerCase().includes('stage 1') ? 'Ideas Submitted' :
                             round.name.toLowerCase().includes('prototype') || round.name.toLowerCase().includes('stage 2') ? 'Prototypes Approved' :
                             round.name.toLowerCase().includes('project') || round.name.toLowerCase().includes('stage 3') ? 'Projects Approved' :
                             round.name.toLowerCase().includes('change makers') || round.name.toLowerCase().includes('innovators') || round.name.toLowerCase().includes('stage 4') ? 'Solutions to be Built' :
                             'Total Count'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}

              {/* Show message if no rounds exist */}
              {(!(roundsData as any)?.rounds || (roundsData as any).rounds.length === 0) && (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Competition Rounds</h3>
                  <p className="text-gray-500 mb-4">Create competition rounds to organize your hackathon</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Round
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Round Progress Widget */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Round Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {roundsLoading || statsLoading ? (
                <div className="text-center py-4">Loading stage progress...</div>
              ) : (
                <div className="space-y-4">
                  {(roundsData as any)?.rounds?.map((round: any, index: number) => {
                    const stageStats = (statsData as any)?.stages?.find((s: any) => s.stageId === round.id) || { submissions: 0, selections: 0 };
                    
                    const getStageIcon = (index: number) => {
                      if (index === 0) return Trophy;
                      if (index === 1) return Medal;
                      return Crown;
                    };
                    
                    const getStageColor = (status: string) => {
                      switch (status) {
                        case 'active': return 'bg-green-100 text-green-600';
                        case 'completed': return 'bg-blue-100 text-blue-600';
                        default: return 'bg-slate-100 text-slate-600';
                      }
                    };
                    
                    const StageIcon = getStageIcon(index);
                    
                    return (
                      <div key={round.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStageColor(round.status)}`}>
                            <StageIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <h4 className="font-medium text-slate-900 mb-1">{round.name}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">{round.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-8 flex-shrink-0">
                          <div className="text-center min-w-[70px]">
                            <div className="text-lg font-semibold text-slate-900">{stageStats.submissions}</div>
                            <div className="text-xs text-slate-500">Submissions</div>
                          </div>
                          <div className="text-center min-w-[70px]">
                            <div className="text-lg font-semibold text-slate-900">{stageStats.selections}</div>
                            <div className="text-xs text-slate-500">Qualified</div>
                          </div>
                          <Badge className={`${
                            round.status === 'active' ? 'bg-green-100 text-green-800' :
                            round.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                            'bg-slate-100 text-slate-800'
                          } whitespace-nowrap min-w-[80px] justify-center`}>
                            {round.status === 'active' ? 'Active' : 
                             round.status === 'completed' ? 'Completed' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center p-3 bg-slate-50 rounded-lg animate-pulse">
                      <div className="w-8 h-8 bg-slate-300 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-300 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-slate-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity: any, index: number) => {
                    const getInitials = (name: string) => {
                      return name.split(' ').map(n => n[0]).join('').toUpperCase();
                    };
                    
                    const getActivityColor = (type: string) => {
                      switch (type) {
                        case 'registration': return 'bg-blue-500';
                        case 'submission': return 'bg-emerald-500';
                        case 'selection': return 'bg-purple-500';
                        default: return 'bg-slate-500';
                      }
                    };

                    const timeAgo = activity.timestamp ? 
                      formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 
                      'Unknown time';
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center mr-3`}>
                            <span className="text-white text-sm font-medium">
                              {getInitials(activity.name)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{activity.name} {activity.action}</p>
                            <p className="text-xs text-slate-500">{timeAgo}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">No recent activity found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RegistrationModal 
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
      />
    </div>
  );
}
