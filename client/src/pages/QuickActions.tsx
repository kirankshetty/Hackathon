import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Mail,
  VideoIcon,
  Github,
  Plus,
  UserCheck,
  Edit3
} from "lucide-react";
import BulkUploadApplicantSelectionModal from "@/components/BulkUploadApplicantSelectionModal";
import BulkUploadStageModal from "@/components/BulkUploadStageModal";

export default function QuickActions() {
  const [, setLocation] = useLocation();
  const [isBulkSelectionModalOpen, setIsBulkSelectionModalOpen] = useState(false);
  const [isBulkStageModalOpen, setIsBulkStageModalOpen] = useState(false);

  const quickActions = [
    {
      title: "Add Applicant",
      description: "Register new participant",
      icon: Plus,
      action: () => setLocation("/add-applicant"),
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Send Orientation",
      description: "Share meeting links",
      icon: VideoIcon,
      action: () => console.log("Send Orientation"),
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Enable Submissions",
      description: "Open project uploads",
      icon: Github,
      action: () => console.log("Enable Submissions"),
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Send Notifications",
      description: "Email participants",
      icon: Mail,
      action: () => setLocation("/notifications"),
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    },
    {
      title: "Bulk Update Applicant Selection",
      description: "Update applicant stage selection",
      icon: UserCheck,
      action: () => setIsBulkSelectionModalOpen(true),
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600"
    },
    {
      title: "Bulk Update Stage Details",
      description: "Update stage information",
      icon: Edit3,
      action: () => setIsBulkStageModalOpen(true),
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600"
    },
    {
      title: "Export Data",
      description: "Download reports",
      icon: Download,
      action: () => setLocation('/export-data'),
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
              <p className="text-slate-500 mt-1">Perform common administrative tasks quickly and efficiently.</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              
              return (
                <Card 
                  key={index} 
                  className="border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-slate-300 cursor-pointer min-h-[120px] flex items-center"
                  onClick={action.action}
                >
                  <CardContent className="p-6 w-full">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${action.iconBg} flex-shrink-0`}>
                        <Icon className={`w-8 h-8 ${action.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate">{action.title}</h3>
                        <p className="text-slate-500 text-base">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Information */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Export Data</h4>
                  <p className="text-slate-600 text-sm">
                    Export applicant data with filters for date range, college name, status, and registration code. 
                    Data is exported in CSV format for easy analysis.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Generate Reports</h4>
                  <p className="text-slate-600 text-sm">
                    Create comprehensive reports including applicant statistics, submission analytics, 
                    and competition progress summaries.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Bulk User Actions</h4>
                  <p className="text-slate-600 text-sm">
                    Perform actions on multiple users simultaneously, including status updates, 
                    selections, and bulk communications.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Send Notifications</h4>
                  <p className="text-slate-600 text-sm">
                    Send targeted email notifications to specific groups of applicants 
                    or broadcast announcements to all participants.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <BulkUploadApplicantSelectionModal 
        isOpen={isBulkSelectionModalOpen}
        onClose={() => setIsBulkSelectionModalOpen(false)}
      />
      <BulkUploadStageModal 
        isOpen={isBulkStageModalOpen}
        onClose={() => setIsBulkStageModalOpen(false)}
      />
    </div>
  );
}