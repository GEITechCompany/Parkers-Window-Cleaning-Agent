import { useState } from 'react';
import { Estimate } from '../types';

export default function EstimateEntry() {
  const [form, setForm] = useState<Estimate>({ name: '', address: '', details: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (!response.ok) throw new Error('Failed to submit estimate');
      
      const result = await response.json();
      setMessage({ type: 'success', text: `Estimate saved with ID: ${result.id}` });
      setForm({ name: '', address: '', details: '', amount: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manual Estimate Entry</h2>
      {message && (
        <div className={`p-2 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input 
          className="border p-2 rounded" 
          placeholder="Customer Name" 
          value={form.name} 
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
          required
        />
        <input 
          className="border p-2 rounded" 
          placeholder="Address" 
          value={form.address} 
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
          required
        />
        <textarea 
          className="border p-2 rounded" 
          placeholder="Job Details" 
          value={form.details} 
          onChange={e => setForm(f => ({ ...f, details: e.target.value }))} 
          required
        />
        <input 
          className="border p-2 rounded" 
          placeholder="Estimate Amount" 
          value={form.amount} 
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} 
          required
        />
        <button 
          type="submit" 
          className={`${loading ? 'bg-blue-400' : 'bg-blue-600'} text-white px-4 py-2 rounded mt-2`}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Estimate'}
        </button>
      </form>
    </div>
  );
} 