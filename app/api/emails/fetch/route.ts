import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export async function GET() {
  try {
    // Create OAuth client with credentials from environment variables
    const oauth2Client = new OAuth2Client(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    // Set the credentials using the refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get messages from the inbox
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      q: 'is:unread -category:promotions -category:social', // Get only unread emails excluding promotions and social
    });

    const messages = response.data.messages || [];
    const emailsData = [];

    // For each message ID, fetch the full message details
    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
      });

      const headers = email.data.payload?.headers || [];
      
      // Extract subject, from, and date headers
      const subject = headers.find(header => header.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(header => header.name === 'From')?.value || 'Unknown Sender';
      const date = headers.find(header => header.name === 'Date')?.value || new Date().toISOString();

      // Extract the email body
      let body = '';
      if (email.data.payload?.parts && email.data.payload.parts.length > 0) {
        // Try to find the text/plain part first
        const textPart = email.data.payload.parts.find(part => part.mimeType === 'text/plain');
        if (textPart && textPart.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        } else {
          // Fallback to the first part with data
          const firstPartWithData = email.data.payload.parts.find(part => part.body?.data);
          if (firstPartWithData && firstPartWithData.body?.data) {
            body = Buffer.from(firstPartWithData.body.data, 'base64').toString('utf-8');
          }
        }
      } else if (email.data.payload?.body?.data) {
        // Handle case when there are no parts
        body = Buffer.from(email.data.payload.body.data, 'base64').toString('utf-8');
      }

      emailsData.push({
        id: message.id,
        subject,
        from,
        date,
        body,
      });
    }

    return NextResponse.json({ emails: emailsData });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
} 