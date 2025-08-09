import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import ApplicantTable from "@/components/ApplicantTable";

export default function ApplicantsPage() {
  const { user } = useAuth();
  const userRole = (user as any)?.role;

  if (!user || !['admin', 'jury'].includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar userRole={userRole} />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {userRole === 'admin' ? 'Applicant Management' : 'Applicant Review'}
              </h2>
              <p className="text-slate-500 mt-1">
                {userRole === 'admin' 
                  ? 'Manage registrations, track progress, and oversee the selection process.'
                  : 'Review submissions and select qualified participants.'
                }
              </p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Applicants Table */}
          <ApplicantTable userRole={userRole} />
        </div>
      </div>
    </div>
  );
}