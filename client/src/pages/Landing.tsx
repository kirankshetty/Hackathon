import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Calendar, Github, Lightbulb, Cpu, FileText, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header with Login Buttons */}
      <header className="container mx-auto px-4 py-4">
        <div className="flex justify-end gap-3">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => window.location.href = '/admin/login'}
          >
            Admin/Jury Login
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => window.location.href = '/applicant/login'}
          >
            Applicant Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Welcome to <span className="text-blue-600">CIEL-Kings VibeAIthon</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            The complete platform for managing hackathon events with seamless registration, 
            jury evaluation, and participant tracking.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/register'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Register as Participant
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Multi-Role Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Dedicated interfaces for admins, jury members, and participants with role-based permissions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
              <CardTitle>Event Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Complete workflow from registration through orientation, submissions, and final results.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Github className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>GitHub Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Seamless GitHub submission tracking with deadline enforcement and resubmission support.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Trophy className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <CardTitle>Real-time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Live dashboard with statistics, progress tracking, and automated notifications.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Vibe-AI-Thon Journey */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mt-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Vibe-AI-Thon Journey
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1: Ideation */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&crop=center" 
                  alt="Ideation - brainstorming and creative thinking" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Ideation</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Brainstorm innovative AI solutions and develop your concept with detailed planning and research.
                </p>
              </div>
            </div>

            {/* Card 2: Prototype Submission */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop&crop=center" 
                  alt="Prototype development - coding and building" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Prototype Submission</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Submit your initial prototype with core functionality and demonstrate proof of concept.
                </p>
              </div>
            </div>

            {/* Card 3: Project Submission */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop&crop=center" 
                  alt="Project submission - documentation and presentation" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Project Submission</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Present your complete project with full documentation, testing, and deployment ready code.
                </p>
              </div>
            </div>

            {/* Card 4: Actual Hack */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&crop=center" 
                  alt="Live hackathon event - competition and collaboration" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Actual Hack</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Participate in the live hackathon event, present your solution, and compete for prizes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
