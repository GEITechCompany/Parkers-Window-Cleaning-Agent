import { useState, useEffect } from 'react';
import { Notification } from '../types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState({ notifications: true, submit: false });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Fetch notifications when component mounts
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(prev => ({ ...prev, notifications: false }));
      }
    };

    fetchNotifications();
  }, []);

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;
    
    setLoading(prev => ({ ...prev, submit: true }));
    setMessage(null);
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });
      
      if (!response.ok) throw new Error('Failed to send notification');
      
      const result = await response.json();
      setNotifications(prev => [result, ...prev]);
      setNewMessage('');
      setMessage({ type: 'success', text: 'Notification sent successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      
      {message && (
        <div className={`p-2 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div className="mb-4 flex gap-2">
        <input
          className="border p-2 rounded flex-grow"
          placeholder="Enter new notification"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <button
          className={`${loading.submit ? 'bg-blue-400' : 'bg-blue-600'} text-white px-4 py-2 rounded`}
          onClick={handleSubmit}
          disabled={loading.submit || !newMessage.trim()}
        >
          {loading.submit ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      {loading.notifications ? (
        <p>Loading notifications...</p>
      ) : (
        <ul className="mb-4 list-disc pl-5">
          {notifications.length === 0 ? (
            <li className="text-gray-700">No notifications yet</li>
          ) : (
            notifications.map((n) => (
              <li key={n.id} className={n.read ? 'text-gray-700' : 'font-semibold'}>
                {n.message}
                <span className="text-xs text-gray-700 ml-2">
                  {n.created_at && new Date(n.created_at).toLocaleString()}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
} 