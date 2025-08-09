import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Handshake, CalendarCheck } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalApplicants: number;
    selectedApplicants: number;
    confirmedParticipants: number;
    eventDayRegistered: number;
  };
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Applicants",
      value: stats?.totalApplicants || 0,
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12%",
      changeLabel: "from last week",
    },
    {
      title: "Selected by Jury",
      value: stats?.selectedApplicants || 0,
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-100",
      change: "+8%",
      changeLabel: "selection rate",
    },
    {
      title: "Confirmed Participation",
      value: stats?.confirmedParticipants || 0,
      icon: Handshake,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-100",
      change: "91.9%",
      changeLabel: "confirmation rate",
    },
    {
      title: "Event Day Registration",
      value: stats?.eventDayRegistered || 0,
      icon: CalendarCheck,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "92.6%",
      changeLabel: "attendance rate",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{card.value.toLocaleString()}</p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor} text-xl w-6 h-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-emerald-600 text-sm font-medium">{card.change}</span>
                <span className="text-slate-500 text-sm ml-2">{card.changeLabel}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
