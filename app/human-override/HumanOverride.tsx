import { useState } from 'react';

type OverrideAction = {
  id: string;
  action: string;
  timestamp: string;
};

export default function HumanOverride() {
  const [overrideHistory, setOverrideHistory] = useState<OverrideAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Simulated override actions
  const overrideActions = [
    { id: 'job-reassign', label: 'Reassign Job to Different Team' },
    { id: 'estimate-adjust', label: 'Adjust Estimate Amount' },
    { id: 'schedule-change', label: 'Change Job Schedule' },
    { id: 'cancel-job', label: 'Cancel Scheduled Job' },
  ];

  const handleOverride = async (actionId: string) => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Simulate API call for override action
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create new override record
      const newOverride: OverrideAction = {
        id: `override-${Date.now()}`,
        action: overrideActions.find(a => a.id === actionId)?.label || actionId,
        timestamp: new Date().toISOString(),
      };
      
      // Add to history
      setOverrideHistory(prev => [newOverride, ...prev]);
      setMessage({ 
        type: 'success', 
        text: `Override action "${newOverride.action}" triggered successfully` 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to trigger override' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Human Override Controls</h2>
      
      {message && (
        <div className={`p-2 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Available Override Actions:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {overrideActions.map(action => (
            <button
              key={action.id}
              onClick={() => handleOverride(action.id)}
              disabled={loading}
              className={`${
                loading ? 'bg-gray-400' : action.id === 'cancel-job' ? 'bg-red-600' : 'bg-blue-600'
              } text-white px-4 py-2 rounded text-left`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-2">Override History:</h3>
        {overrideHistory.length === 0 ? (
          <p className="text-gray-500">No override actions taken yet</p>
        ) : (
          <ul className="border rounded divide-y">
            {overrideHistory.map(override => (
              <li key={override.id} className="p-2">
                <div className="font-medium">{override.action}</div>
                <div className="text-sm text-gray-500">
                  {new Date(override.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 