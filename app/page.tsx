'use client';
import { useState } from 'react';
import EstimateEntry from './estimate-entry/EstimateEntry';
import TeamScheduling from './team-scheduling/TeamScheduling';
import Notifications from './notifications/Notifications';
import HumanOverride from './human-override/HumanOverride';
import EmailParsing from './email-parsing/EmailParsing';
import AuthGuard from './auth/AuthGuard';
import Header from './components/Header';

const sections = [
  { name: 'Estimate Entry', component: <EstimateEntry /> },
  { name: 'Team Scheduling', component: <TeamScheduling /> },
  { name: 'Notifications', component: <Notifications /> },
  { name: 'Human Override', component: <HumanOverride /> },
  { name: 'Email Parsing', component: <EmailParsing /> },
];

function Dashboard() {
  const [active, setActive] = useState(0);

  return (
    <main className="min-h-screen flex flex-col items-center bg-gray-100">
      <Header />

      <div className="w-full max-w-7xl p-8">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <nav className="flex flex-wrap gap-2 mb-8">
          {sections.map((section, idx) => (
            <button
              key={section.name}
              className={`px-4 py-2 rounded ${active === idx ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}
              onClick={() => setActive(idx)}
            >
              {section.name}
            </button>
          ))}
        </nav>
        <section className="w-full bg-white rounded shadow p-6">
          {sections[active].component}
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
