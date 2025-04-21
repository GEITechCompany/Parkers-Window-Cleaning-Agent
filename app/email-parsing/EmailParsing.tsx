'use client';

import { useState, useEffect } from 'react';
import { Estimate } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

type Email = {
  id: string;
  threadId: string;
  snippet: string;
  headers: {
    subject: string;
    from: string;
    to: string;
    date: string;
  };
  body: string;
};

type ParseResult = {
  emailId: string;
  subject: string;
  from: string;
  parsed: {
    customerName: string;
    address: string;
    phone: string;
    requestType: string;
    requestedDate: string;
    urgency: string;
    confidence: number;
  };
  suggestedAction?: {
    type: string;
    data: Partial<Estimate>;
  };
};

export default function EmailParsing() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [parsingResult, setParsingResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState({ emails: false, parsing: false });
  const [error, setError] = useState<string | null>(null);

  // Fetch emails when component mounts
  useEffect(() => {
    const fetchEmails = async () => {
      setIsLoading(prev => ({ ...prev, emails: true }));
      setError(null);
      
      try {
        const response = await fetch('/api/email-parsing');
        if (!response.ok) {
          throw new Error(`Failed to fetch emails: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.emails && Array.isArray(data.emails)) {
          setEmails(data.emails);
        } else {
          setEmails([]);
        }
      } catch (err) {
        console.error('Error fetching emails:', err);
        setError(
          "Gmail API authentication error: The email service is not properly configured. Please check your Gmail API credentials in the environment variables."
        );
        setEmails([]);
      } finally {
        setIsLoading(prev => ({ ...prev, emails: false }));
      }
    };

    fetchEmails();
  }, []);

  const handleParse = async (emailId: string) => {
    setSelectedEmail(emailId);
    setIsLoading(prev => ({ ...prev, parsing: true }));
    setError(null);
    
    try {
      const response = await fetch('/api/email-parsing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to parse email: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setParsingResult(result.data);
      } else {
        throw new Error(result.error || 'Failed to parse email');
      }
    } catch (err) {
      console.error('Error parsing email:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse email');
    } finally {
      setIsLoading(prev => ({ ...prev, parsing: false }));
    }
  };

  const createEstimate = async (estimateData: Partial<Estimate>) => {
    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estimateData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create estimate: ${response.statusText}`);
      }
      
      // Show success message or redirect
      alert('Estimate created successfully!');
      
    } catch (err) {
      console.error('Error creating estimate:', err);
      alert(`Failed to create estimate: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (isLoading.emails) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Email Parsing</h2>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Email Parsing</h2>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          {error.includes("Gmail API") && (
            <p className="mt-2 text-sm">
              To fix this issue, please configure the following environment variables:
              <ul className="list-disc pl-5 mt-1">
                <li>GMAIL_CLIENT_ID</li>
                <li>GMAIL_CLIENT_SECRET</li>
                <li>GMAIL_REFRESH_TOKEN</li>
                <li>REDIRECT_URI</li>
              </ul>
            </p>
          )}
        </div>
      )}
      
      {emails.length === 0 ? (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
          <p className="text-yellow-800">
            No unread emails found. Check your Gmail account or refresh.
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Recent Emails ({emails.length})</h3>
          <div className="border rounded divide-y">
            {emails.map(email => (
              <div key={email.id} className="p-3 flex flex-col">
                <div className="flex justify-between">
                  <div className="font-medium">{email.headers.subject}</div>
                  <div className="text-sm text-gray-700">{new Date(email.headers.date).toLocaleString()}</div>
                </div>
                <div className="text-sm text-gray-800">From: {email.headers.from}</div>
                <p className="my-2 text-sm">{email.snippet}</p>
                <button
                  onClick={() => handleParse(email.id)}
                  className={`self-start px-3 py-1 rounded text-sm ${
                    isLoading.parsing && selectedEmail === email.id 
                      ? 'bg-gray-300' 
                      : 'bg-blue-600 text-white'
                  }`}
                  disabled={isLoading.parsing && selectedEmail === email.id}
                >
                  {isLoading.parsing && selectedEmail === email.id ? 'Parsing...' : 'Parse Email'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {parsingResult && (
        <div className="border p-4 rounded">
          <h3 className="font-medium mb-2">Parsing Result:</h3>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="flex col-span-2">
              <div className="font-medium w-32">Subject:</div>
              <div>{parsingResult.subject}</div>
            </div>
            <div className="flex col-span-2">
              <div className="font-medium w-32">From:</div>
              <div>{parsingResult.from}</div>
            </div>
            <div className="flex">
              <div className="font-medium w-32">Customer:</div>
              <div>{parsingResult.parsed.customerName || '—'}</div>
            </div>
            <div className="flex">
              <div className="font-medium w-32">Request Type:</div>
              <div>{parsingResult.parsed.requestType}</div>
            </div>
            <div className="flex col-span-2">
              <div className="font-medium w-32">Address:</div>
              <div>{parsingResult.parsed.address || '—'}</div>
            </div>
            <div className="flex">
              <div className="font-medium w-32">Phone:</div>
              <div>{parsingResult.parsed.phone || '—'}</div>
            </div>
            <div className="flex">
              <div className="font-medium w-32">Urgency:</div>
              <div>{parsingResult.parsed.urgency}</div>
            </div>
            <div className="flex">
              <div className="font-medium w-32">Confidence:</div>
              <div>{Math.round(parsingResult.parsed.confidence * 100)}%</div>
            </div>
          </div>
          
          {parsingResult.suggestedAction && parsingResult.suggestedAction.type === 'create_estimate' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-800 mb-2">Suggested Action:</h4>
              <p className="mb-3 text-sm">This appears to be an estimate request. Would you like to create an estimate with the parsed information?</p>
              <button
                onClick={() => createEstimate(parsingResult.suggestedAction!.data)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Estimate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 