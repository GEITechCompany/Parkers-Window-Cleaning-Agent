'use client';

import { useState } from 'react';
import { fetchEmails, parseEmail, SchedulingInfo } from '@/lib/utils/emailUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

export function EmailParsingDashboard() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [parsedData, setParsedData] = useState<SchedulingInfo | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isParsingLoading, setIsParsingLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [manualEmailContent, setManualEmailContent] = useState<string>('');

  // Function to fetch emails
  const handleFetchEmails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEmails = await fetchEmails();
      setEmails(fetchedEmails);
      if (fetchedEmails.length > 0) {
        setSelectedEmail(fetchedEmails[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch emails');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to parse selected email
  const handleParseEmail = async (content: string) => {
    setIsParsingLoading(true);
    setParsedData(null);
    setError(null);
    
    try {
      const result = await parseEmail(content);
      setParsedData(result.data);
      setConfidence(result.confidence);
    } catch (err: any) {
      setError(err.message || 'Failed to parse email');
    } finally {
      setIsParsingLoading(false);
    }
  };

  // Function to handle email selection
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setParsedData(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get confidence level badge color
  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Parsing Dashboard</CardTitle>
          <CardDescription>
            Fetch emails and parse them to extract scheduling information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fetch">
            <TabsList className="mb-4">
              <TabsTrigger value="fetch">Fetch Emails</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fetch" className="space-y-4">
              <div className="flex justify-between items-center">
                <Button 
                  onClick={handleFetchEmails} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Fetch Emails
                    </>
                  )}
                </Button>
                <div>
                  {emails.length > 0 && `${emails.length} emails found`}
                </div>
              </div>
              
              {emails.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="border rounded-md overflow-hidden">
                    <div className="p-3 bg-muted font-medium">Email List</div>
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                      {emails.map((email) => (
                        <div 
                          key={email.id}
                          className={`p-3 cursor-pointer hover:bg-muted/50 ${selectedEmail?.id === email.id ? 'bg-muted' : ''}`}
                          onClick={() => handleSelectEmail(email)}
                        >
                          <div className="font-medium truncate">{email.subject}</div>
                          <div className="text-sm text-muted-foreground">{email.from}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(email.date)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 border rounded-md overflow-hidden">
                    <div className="p-3 bg-muted font-medium flex justify-between items-center">
                      <span>Email Content</span>
                      {selectedEmail && (
                        <Button 
                          size="sm" 
                          onClick={() => handleParseEmail(selectedEmail.body)}
                          disabled={isParsingLoading || !selectedEmail}
                        >
                          {isParsingLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Parsing...
                            </>
                          ) : (
                            'Parse Email'
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="p-3 max-h-[400px] overflow-y-auto">
                      {selectedEmail ? (
                        <>
                          <div className="mb-2">
                            <span className="font-medium">Subject:</span> {selectedEmail.subject}
                          </div>
                          <div className="mb-2">
                            <span className="font-medium">From:</span> {selectedEmail.from}
                          </div>
                          <div className="mb-2">
                            <span className="font-medium">Date:</span> {formatDate(selectedEmail.date)}
                          </div>
                          <Separator className="my-2" />
                          <div className="whitespace-pre-wrap">{selectedEmail.body}</div>
                        </>
                      ) : (
                        <div className="text-muted-foreground text-center p-4">
                          Select an email to view its content
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <div>
                <Textarea
                  placeholder="Paste the email content here..."
                  className="h-[200px]"
                  value={manualEmailContent}
                  onChange={(e) => setManualEmailContent(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => handleParseEmail(manualEmailContent)}
                disabled={isParsingLoading || !manualEmailContent.trim()}
              >
                {isParsingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Parsing...
                  </>
                ) : (
                  'Parse Email'
                )}
              </Button>
            </TabsContent>
          </Tabs>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
      
      {parsedData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Parsed Scheduling Information</CardTitle>
              <Badge className={getConfidenceBadgeColor(confidence)}>
                Confidence: {Math.round(confidence * 100)}%
              </Badge>
            </div>
            <CardDescription>
              Extracted information from the email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Customer Name:</span> {parsedData.customerName}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {parsedData.phone}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {parsedData.email}
                </div>
                <div>
                  <span className="font-medium">Address:</span> {parsedData.address}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Service:</span> {parsedData.service}
                </div>
                <div>
                  <span className="font-medium">Preferred Date:</span> {parsedData.preferredDate}
                </div>
                {parsedData.alternativeDates && parsedData.alternativeDates.length > 0 && (
                  <div>
                    <span className="font-medium">Alternative Dates:</span>{' '}
                    {parsedData.alternativeDates.join(', ')}
                  </div>
                )}
                {parsedData.notes && (
                  <div>
                    <span className="font-medium">Notes:</span> {parsedData.notes}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button disabled>
              <Check className="mr-2 h-4 w-4" />
              Create Job from Email
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 