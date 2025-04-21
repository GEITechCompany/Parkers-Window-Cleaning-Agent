import { useState, useEffect } from 'react';
import { Job, Team } from '../types';

export default function TeamScheduling() {
  const [form, setForm] = useState<Job>({ team_id: '', job_name: '', date: '', status: 'scheduled' });
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState({ teams: true, submit: false });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch teams when component mounts
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        if (!response.ok) throw new Error('Failed to fetch teams');
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(prev => ({ ...prev, teams: false }));
      }
    };

    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submit: true }));
    setMessage(null);
    
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (!response.ok) throw new Error('Failed to schedule job');
      
      const result = await response.json();
      setMessage({ type: 'success', text: `Job scheduled with ID: ${result.id}` });
      setForm({ team_id: '', job_name: '', date: '', status: 'scheduled' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Team Scheduling</h2>
      {message && (
        <div className={`p-2 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <select 
          className="border p-2 rounded" 
          value={form.team_id} 
          onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
          required
          disabled={loading.teams}
        >
          <option value="">Select Team</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <input 
          className="border p-2 rounded" 
          placeholder="Job Name" 
          value={form.job_name} 
          onChange={e => setForm(f => ({ ...f, job_name: e.target.value }))}
          required
        />
        <input 
          className="border p-2 rounded" 
          type="date" 
          value={form.date} 
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          required
        />
        <button 
          type="submit" 
          className={`${loading.submit ? 'bg-blue-400' : 'bg-blue-600'} text-white px-4 py-2 rounded mt-2`}
          disabled={loading.submit || loading.teams}
        >
          {loading.submit ? 'Scheduling...' : 'Assign Job'}
        </button>
      </form>
    </div>
  );
} 