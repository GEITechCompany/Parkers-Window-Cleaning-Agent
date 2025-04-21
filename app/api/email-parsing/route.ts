import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { supabaseAdmin } from '../utils/supabaseServer';
import { safeAsync } from '@/app/utils/errorHandling';

// Gmail API setup
const getGmailClient = () => {
  const client_id = process.env.GMAIL_CLIENT_ID;
  const client_secret = process.env.GMAIL_CLIENT_SECRET;
  const redirect_uri = process.env.REDIRECT_URI;
  const refresh_token = process.env.GMAIL_REFRESH_TOKEN;
  
  // Check if required credentials are present
  if (!client_id || !client_secret || !refresh_token) {
    throw new Error(
      'Gmail API credentials missing. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN in your environment variables.'
    );
  }
  
  const oauth2Client = new OAuth2Client(
    client_id,
    client_secret,
    redirect_uri
  );
  
  // Set the refresh token
  oauth2Client.setCredentials({
    refresh_token: refresh_token,
  });
  
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Function to decode base64 encoded email body
const decodeBase64 = (data: string) => {
  return Buffer.from(data, 'base64').toString('utf-8');
};

// Parse email content for customer details
const parseEmailContent = (content: string) => {
  // Example parsing logic - to be enhanced based on actual email formats
  const nameMatch = content.match(/(?:name|customer|client):\s*([\w\s]+)/i);
  const phoneMatch = content.match(/(?:phone|telephone|cell):\s*([\d\-\+\(\)\s]+)/i);
  const emailMatch = content.match(/(?:email|e-mail):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  const addressMatch = content.match(/(?:address|location):\s*([\w\s,.-]+)/i);
  const serviceMatch = content.match(/(?:service|work|job):\s*([\w\s,.-]+)/i);
  const dateMatch = content.match(/(?:date|scheduled|appointment):\s*([\w\s,.-]+)/i);
  
  return {
    name: nameMatch ? nameMatch[1].trim() : null,
    phone: phoneMatch ? phoneMatch[1].trim() : null,
    email: emailMatch ? emailMatch[1].trim() : null,
    address: addressMatch ? addressMatch[1].trim() : null,
    service: serviceMatch ? serviceMatch[1].trim() : null,
    requestedDate: dateMatch ? dateMatch[1].trim() : null,
    needsEstimate: content.toLowerCase().includes('estimate') || content.toLowerCase().includes('quote'),
  };
};

// GET handler to fetch emails
export async function GET() {
  try {
    const gmail = getGmailClient();
    
    // Fetch list of messages from Gmail inbox
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10, // Limit to 10 most recent emails
      q: 'is:unread', // Only fetch unread emails
    });
    
    const messages = response.data.messages || [];
    const emails = [];
    
    // Get details for each message
    for (const message of messages) {
      const emailData = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
      });
      
      const headers = emailData.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      // Get snippet or body
      let snippet = emailData.data.snippet || '';
      
      emails.push({
        id: message.id,
        subject,
        from,
        date,
        snippet,
      });
    }
    
    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch emails';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST handler to parse a specific email
export async function POST(request: NextRequest) {
  try {
    const { emailId } = await request.json();
    
    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }
    
    const gmail = getGmailClient();
    
    // Fetch full email content
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: emailId,
      format: 'full',
    });
    
    // Get email body
    let emailContent = '';
    const payload = email.data.payload;
    
    if (payload?.body?.data) {
      // If the body is directly in the payload
      emailContent = decodeBase64(payload.body.data);
    } else if (payload?.parts) {
      // If the body is in parts (multipart email)
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          emailContent = decodeBase64(part.body.data);
          break;
        }
      }
    }
    
    if (!emailContent) {
      return NextResponse.json(
        { error: 'Unable to extract email content' },
        { status: 400 }
      );
    }
    
    // Parse the email content
    const parsedData = parseEmailContent(emailContent);
    
    // Get headers for metadata
    const headers = email.data.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
    
    // Extract sender email from the "from" field
    const senderEmailMatch = from.match(/(?:<)?([\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,})(?:>)?/);
    const senderEmail = senderEmailMatch ? senderEmailMatch[1] : null;
    
    // Combine with metadata
    const parseResult = {
      ...parsedData,
      subject,
      sender: from,
      senderEmail: senderEmail || parsedData.email, // Use extracted email if available
      rawContent: emailContent,
    };
    
    return NextResponse.json({ parseResult });
  } catch (error) {
    console.error('Error parsing email:', error);
    return NextResponse.json(
      { error: 'Failed to parse email' },
      { status: 500 }
    );
  }
} 