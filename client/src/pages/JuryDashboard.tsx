import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import ApplicantTable from "@/components/ApplicantTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Clock, CheckCircle } from "lucide-react";

export default function JuryDashboard() {
  const { data: applicants, isLoading } = useQuery({
    queryKey: ["/api/applicants?status=submitted&page=1&limit=50"],
  });

  const pendingReviews = (applicants as any)?.applicants?.filter((a: any) => !a.reviewedAt)?.length || 0;
  const reviewedCount = (applicants as any)?.applicants?.filter((a: any) => a.reviewedAt)?.length || 0;
  const totalSubmissions = (applicants as any)?.total || 0;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar userRole="jury" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Jury Dashboard</h2>
              <p className="text-slate-500 mt-1">Review submissions and select qualified participants.</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Review Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Total Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Github className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{totalSubmissions}</p>
                    <p className="text-sm text-slate-500">GitHub repositories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-amber-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{pendingReviews}</p>
                    <p className="text-sm text-slate-500">Awaiting evaluation</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Reviewed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{reviewedCount}</p>
                    <p className="text-sm text-slate-500">Completed reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Guidelines */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Review Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Evaluation Criteria</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Code quality and organization</li>
                    <li>• Innovation and creativity</li>
                    <li>• Technical implementation</li>
                    <li>• Documentation and README</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Actions Available</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                      Select Participant
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      Download Submission
                    </Badge>
                    <Badge variant="outline" className="border-amber-200 text-amber-700">
                      Add Review Notes
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions Table */}
          <ApplicantTable userRole="jury" />
        </div>
      </div>
    </div>
  );
}
