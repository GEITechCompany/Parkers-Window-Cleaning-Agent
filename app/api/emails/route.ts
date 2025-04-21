import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Gmail API setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Function to decode base64 email content
function decodeBase64(data: string) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

export async function GET() {
  try {
    // Get list of messages from Gmail
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20, // Limit results to latest 20 emails
      q: 'in:inbox', // Only get emails from inbox
    });

    const messages = response.data.messages || [];
    const emails = [];

    // Fetch details for each message
    for (const message of messages) {
      const emailData = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
      });

      const headers = emailData.data.payload?.headers || [];
      
      // Extract email metadata
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      // Get email body (simplified version - in production would need to handle multipart emails better)
      let body = '';
      if (emailData.data.payload?.body?.data) {
        body = decodeBase64(emailData.data.payload.body.data);
      } else if (emailData.data.payload?.parts) {
        // Try to find text parts
        const textParts = emailData.data.payload.parts.filter(
          part => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );
        
        if (textParts.length > 0 && textParts[0].body?.data) {
          body = decodeBase64(textParts[0].body.data);
        }
      }

      emails.push({
        id: message.id,
        subject,
        from,
        date,
        body,
        snippet: emailData.data.snippet || '',
      });
    }

    return NextResponse.json({ emails });
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emails' },
      { status: 500 }
    );
  }
} 