import { db } from './server/db.js';
import { juryMembers, projectSubmissions, orientationSessions, competitionRounds } from './shared/schema.js';

async function generateSampleData() {
  console.log('Adding sample jury members...');
  
  const juryData = [
    {
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@techcorp.com',
      expertise: 'Full-Stack Development',
      company: 'TechCorp Inc.',
      position: 'Senior Software Architect',
      assignedApplicants: []
    },
    {
      name: 'Mike Rodriguez',
      email: 'mike.r@innovateai.com',
      expertise: 'Machine Learning & AI',
      company: 'InnovateAI',
      position: 'ML Engineering Lead',
      assignedApplicants: []
    },
    {
      name: 'Emily Watson',
      email: 'emily.watson@cloudsolutions.io',
      expertise: 'Cloud Architecture',
      company: 'CloudSolutions',
      position: 'Cloud Solutions Architect',
      assignedApplicants: []
    },
    {
      name: 'David Kim',
      email: 'david.kim@cybersec.net',
      expertise: 'Cybersecurity',
      company: 'SecureNet',
      position: 'Security Engineer',
      status: 'inactive',
      assignedApplicants: []
    },
    {
      name: 'Lisa Zhang',
      email: 'lisa.zhang@mobilefirst.com',
      expertise: 'Mobile Development',
      company: 'MobileFirst',
      position: 'Lead Mobile Developer',
      assignedApplicants: []
    }
  ];

  await db.insert(juryMembers).values(juryData).onConflictDoNothing();

  console.log('Adding sample project submissions...');
  
  // Get some applicant IDs first
  const applicants = await db.query.applicants.findMany({ limit: 10 });
  
  const submissionData = [
    {
      applicantId: applicants[0]?.id || '219e15a7-f292-413f-ba8e-123456789012',
      projectTitle: 'Smart Campus Assistant',
      description: 'An AI-powered mobile app that helps students navigate campus resources, find study groups, and manage their academic schedule.',
      githubUrl: 'https://github.com/user1/smart-campus-assistant',
      liveUrl: 'https://smart-campus.vercel.app',
      techStack: ['React Native', 'Node.js', 'MongoDB', 'OpenAI API'],
      juryScore: '{"overall": 85, "technical": 88, "innovation": 82, "presentation": 86}',
      juryFeedback: 'Excellent implementation with great user experience. Strong technical foundation.',
      status: 'reviewed'
    },
    {
      applicantId: applicants[1]?.id || '219e15a7-f292-413f-ba8e-123456789013',
      projectTitle: 'EcoTracker',
      description: 'A web application that tracks personal carbon footprint and suggests eco-friendly alternatives.',
      githubUrl: 'https://github.com/user2/eco-tracker',
      liveUrl: 'https://ecotracker.netlify.app',
      techStack: ['Vue.js', 'Express.js', 'PostgreSQL', 'Chart.js'],
      juryScore: '{"overall": 78, "technical": 75, "innovation": 85, "presentation": 72}',
      juryFeedback: 'Great concept with room for improvement in technical execution.',
      status: 'reviewed'
    },
    {
      applicantId: applicants[2]?.id || '219e15a7-f292-413f-ba8e-123456789014',
      projectTitle: 'CodeMentor Platform',
      description: 'A peer-to-peer learning platform connecting junior developers with experienced mentors.',
      githubUrl: 'https://github.com/user3/code-mentor',
      techStack: ['React', 'Django', 'Redis', 'WebSocket'],
      status: 'submitted'
    },
    {
      applicantId: applicants[3]?.id || '219e15a7-f292-413f-ba8e-123456789015',
      projectTitle: 'HealthSync',
      description: 'IoT-based health monitoring system with real-time data visualization and alerts.',
      githubUrl: 'https://github.com/user4/health-sync',
      liveUrl: 'https://healthsync.herokuapp.com',
      techStack: ['Angular', 'Python Flask', 'InfluxDB', 'Arduino'],
      juryScore: '{"overall": 92, "technical": 95, "innovation": 90, "presentation": 91}',
      juryFeedback: 'Outstanding project with excellent technical implementation and real-world impact.',
      status: 'selected'
    }
  ];

  await db.insert(projectSubmissions).values(submissionData).onConflictDoNothing();

  console.log('Adding sample orientation sessions...');
  
  const orientationData = [
    {
      title: 'Hackathon Kickoff & Rules',
      description: 'Welcome session covering hackathon rules, timeline, evaluation criteria, and team formation guidelines.',
      scheduledTime: new Date('2024-02-15T10:00:00Z'),
      meetingLink: 'https://zoom.us/j/123456789',
      duration: '2 hours',
      maxParticipants: '100',
      registeredCount: '78',
      status: 'completed'
    },
    {
      title: 'Technical Deep Dive',
      description: 'Technical session on available APIs, development resources, and best practices for rapid prototyping.',
      scheduledTime: new Date('2024-02-16T14:00:00Z'),
      meetingLink: 'https://zoom.us/j/987654321',
      duration: '1.5 hours',
      maxParticipants: '50',
      registeredCount: '42',
      status: 'completed'
    },
    {
      title: 'Mentorship & Q&A',
      description: 'Open session with industry mentors for project guidance and technical questions.',
      scheduledTime: new Date('2024-02-20T16:00:00Z'),
      meetingLink: 'https://zoom.us/j/555666777',
      duration: '1 hour',
      maxParticipants: '75',
      registeredCount: '65',
      status: 'scheduled'
    },
    {
      title: 'Final Presentation Prep',
      description: 'Workshop on creating effective presentations and demo strategies for the final showcase.',
      scheduledTime: new Date('2024-02-22T11:00:00Z'),
      meetingLink: 'https://zoom.us/j/111222333',
      duration: '1 hour',
      maxParticipants: '60',
      registeredCount: '0',
      status: 'scheduled'
    }
  ];

  await db.insert(orientationSessions).values(orientationData).onConflictDoNothing();

  console.log('Adding sample competition rounds...');
  
  const roundsData = [
    {
      name: 'Preliminary Round',
      description: 'Initial screening based on project submissions and technical documentation.',
      startTime: new Date('2024-02-18T09:00:00Z'),
      endTime: new Date('2024-02-18T18:00:00Z'),
      maxParticipants: '100',
      currentParticipants: '85',
      status: 'completed',
      requirements: ['Submit working prototype', 'Complete technical documentation', 'Record demo video'],
      prizes: ['Top 20 advance to semifinals'],
      judgeIds: []
    },
    {
      name: 'Semifinal Round',
      description: 'Live presentations and technical interviews with jury members.',
      startTime: new Date('2024-02-20T10:00:00Z'),
      endTime: new Date('2024-02-20T17:00:00Z'),
      maxParticipants: '20',
      currentParticipants: '18',
      status: 'completed',
      requirements: ['Live presentation (10 minutes)', 'Technical Q&A session', 'Code review'],
      prizes: ['Top 5 advance to finals', '$500 each to semifinalists'],
      judgeIds: []
    },
    {
      name: 'Final Round',
      description: 'Final presentations and demonstrations to determine the winners.',
      startTime: new Date('2024-02-23T13:00:00Z'),
      endTime: new Date('2024-02-23T18:00:00Z'),
      maxParticipants: '5',
      currentParticipants: '5',
      status: 'active',
      requirements: ['Final presentation (15 minutes)', 'Live demo', 'Business case presentation'],
      prizes: ['1st Place: $5000', '2nd Place: $3000', '3rd Place: $1000', 'Innovation Award: $1500'],
      judgeIds: []
    },
    {
      name: 'Awards Ceremony',
      description: 'Recognition ceremony and networking event with industry partners.',
      startTime: new Date('2024-02-23T19:00:00Z'),
      endTime: new Date('2024-02-23T21:00:00Z'),
      maxParticipants: '200',
      currentParticipants: '145',
      status: 'upcoming',
      requirements: ['Attend closing ceremony'],
      prizes: ['Networking opportunities', 'Certificate of participation'],
      judgeIds: []
    }
  ];

  await db.insert(competitionRounds).values(roundsData).onConflictDoNothing();

  console.log('Sample data generation completed!');
}

generateSampleData().catch(console.error).finally(() => process.exit(0));
