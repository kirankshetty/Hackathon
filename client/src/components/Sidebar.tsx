import { 
  BarChart3, 
  Users, 
  Bus, 
  Github, 
  Video, 
  Trophy, 
  Settings, 
  LogOut,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  userRole: 'admin' | 'jury' | 'applicant';
}

export default function Sidebar({ userRole }: SidebarProps) {
  const [location] = useLocation();
  
  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const getNavigationItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { icon: BarChart3, label: 'Dashboard', href: '/', active: true },
          { icon: Users, label: 'Applicants', href: '/applicants', active: false },
          { icon: Trophy, label: 'Competition Rounds', href: '/rounds', active: false },
          { icon: Zap, label: 'Quick Actions', href: '/quick-actions', active: false },
          { icon: Settings, label: 'Settings', href: '/settings', active: false },
        ];
      case 'jury':
        return [
          { icon: BarChart3, label: 'Dashboard', href: '/', active: true },
          { icon: Users, label: 'Applicants', href: '/applicants', active: false },
          { icon: Github, label: 'Submissions', href: '/submissions', active: false },
        ];
      case 'applicant':
        return [
          { icon: BarChart3, label: 'Dashboard', href: '/', active: true },
          { icon: Github, label: 'My Submissions', href: '/my-submissions', active: false },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200 fixed h-full z-10">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">HackathonHub</h1>
        <p className="text-sm text-slate-500 mt-1">
          {userRole === 'admin' ? 'Admin Dashboard' : 
           userRole === 'jury' ? 'Jury Panel' : 
           'Participant Portal'}
        </p>
      </div>
      
      <nav className="mt-6">
        <div className="px-6 mb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Main</h3>
        </div>
        
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center px-6 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 ${
                location === item.href ? 'text-slate-900 bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${item.active ? 'text-blue-500' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-900">User</p>
              <p className="text-xs text-slate-500">{userRole}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="p-2"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
