import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Calendar, CheckCircle2, Clock, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from './LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

interface ParsedData {
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  service: string | null;
  requestedDate: string | null;
  needsEstimate: boolean;
  subject: string;
  sender: string;
  senderEmail: string | null;
  rawContent: string;
}

const EmailParsing: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParsedData | null>(null);
  const [parsingEmail, setParsingEmail] = useState(false);
  const [showParseResult, setShowParseResult] = useState(false);
  
  // Fetch emails on component mount
  useEffect(() => {
    fetchEmails();
  }, []);
  
  // Function to fetch emails from API
  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/email-parsing');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emails');
      }
      
      setEmails(data.emails || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to parse a specific email
  const parseEmail = async (emailId: string) => {
    setParsingEmail(true);
    setError(null);
    setSelectedEmail(emailId);
    
    try {
      const response = await fetch('/api/email-parsing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse email');
      }
      
      setParseResult(data.parseResult);
      setShowParseResult(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error parsing email:', err);
    } finally {
      setParsingEmail(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      return dateString;
    }
  };
  
  // Close the parse result dialog
  const closeParseResult = () => {
    setShowParseResult(false);
    setParseResult(null);
  };
  
  // Create a new appointment or estimate from the parsed data
  const createFromParsedData = (type: 'appointment' | 'estimate') => {
    // This would navigate to create form or POST to API
    console.log(`Creating ${type} from parsed data:`, parseResult);
    
    // Close dialog after action
    closeParseResult();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Parsing
        </CardTitle>
        <CardDescription>
          Fetch and analyze customer emails to extract appointment and estimate requests
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <>
            {emails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No unread emails found.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">{email.from}</TableCell>
                        <TableCell>{email.subject}</TableCell>
                        <TableCell>{formatDate(email.date)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => parseEmail(email.id)}
                            disabled={parsingEmail && selectedEmail === email.id}
                          >
                            {parsingEmail && selectedEmail === email.id ? (
                              <LoadingSpinner size="small" />
                            ) : (
                              'Parse'
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {!loading && emails.length > 0 && `Showing ${emails.length} emails`}
        </div>
        <Button
          variant="outline"
          onClick={fetchEmails}
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="small" /> : 'Refresh'}
        </Button>
      </CardFooter>
      
      {/* Parse Result Dialog */}
      <Dialog open={showParseResult} onOpenChange={closeParseResult}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Analysis Results</DialogTitle>
            <DialogDescription>
              Extracted information from the selected email
            </DialogDescription>
          </DialogHeader>
          
          {parseResult && (
            <Tabs defaultValue="parsed">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="parsed">Parsed Data</TabsTrigger>
                <TabsTrigger value="raw">Raw Email</TabsTrigger>
              </TabsList>
              
              <TabsContent value="parsed" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Customer Information</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Name:</span>
                        <span className="text-sm">{parseResult.name || 'Not found'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Email:</span>
                        <span className="text-sm">{parseResult.email || parseResult.senderEmail || 'Not found'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Phone:</span>
                        <span className="text-sm">{parseResult.phone || 'Not found'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Address:</span>
                        <span className="text-sm">{parseResult.address || 'Not found'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Service Details</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Service:</span>
                        <span className="text-sm">{parseResult.service || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Requested Date:</span>
                        <span className="text-sm">{parseResult.requestedDate || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Need Estimate:</span>
                        <span className="text-sm">
                          {parseResult.needsEstimate ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                              No
                            </Badge>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Alert className={`${parseResult.address ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <CheckCircle2 className={`h-4 w-4 ${parseResult.address ? 'text-green-600' : 'text-amber-600'}`} />
                    <AlertTitle className={`${parseResult.address ? 'text-green-800' : 'text-amber-800'}`}>
                      Analysis Complete
                    </AlertTitle>
                    <AlertDescription className={`${parseResult.address ? 'text-green-700' : 'text-amber-700'}`}>
                      {parseResult.address 
                        ? 'Successfully extracted address and contact information.' 
                        : 'Some information could not be extracted. Manual review recommended.'}
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
              
              <TabsContent value="raw">
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  <div className="whitespace-pre-wrap font-mono text-xs">
                    {parseResult.rawContent}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeParseResult}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="gap-2"
              onClick={() => createFromParsedData('estimate')}
              disabled={!parseResult?.address}
            >
              <Clock className="h-4 w-4" />
              Create Estimate
            </Button>
            <Button
              className="gap-2"
              onClick={() => createFromParsedData('appointment')}
              disabled={!parseResult?.address || !parseResult?.requestedDate}
            >
              <Calendar className="h-4 w-4" />
              Schedule Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EmailParsing; 