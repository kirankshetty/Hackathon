import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import { Users, FileText, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import ExportDataModal from "@/components/ExportDataModal";

export default function ExportData() {
  const [, setLocation] = useLocation();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'applicants' | 'rounds' | null>(null);

  const exportOptions = [
    {
      title: "Applicants Data",
      description: "Export applicant information and status",
      icon: Users,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      onClick: () => {
        setExportType('applicants');
        setIsExportModalOpen(true);
      }
    },
    {
      title: "Competition Round Details", 
      description: "Export round configurations and statistics",
      icon: FileText,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      onClick: () => {
        setExportType('rounds');
        setIsExportModalOpen(true);
      }
    }
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/quick-actions')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Quick Actions</span>
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Export Data</h2>
                <p className="text-slate-500 mt-1">Download reports and data exports from the system.</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Export Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {exportOptions.map((option, index) => {
              const Icon = option.icon;
              
              return (
                <Card 
                  key={index}
                  className="border border-orange-200 hover:shadow-lg transition-all duration-200 hover:border-orange-300 cursor-pointer bg-orange-50/30 min-h-[160px] flex items-center"
                  onClick={option.onClick}
                >
                  <CardContent className="p-8 w-full">
                    <div className="flex items-center space-x-6">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${option.iconBg} flex-shrink-0`}>
                        <Icon className={`w-10 h-10 ${option.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">{option.title}</h3>
                        <p className="text-slate-600 text-base leading-relaxed">{option.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportType(null);
        }}
        exportType={exportType}
      />
    </div>
  );
}