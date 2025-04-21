import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Gmail API configuration
const GMAIL_CLIENT_ID = process.env.GMAIL_API_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_API_CLIENT_SECRET || '';
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_API_REFRESH_TOKEN || '';
const GMAIL_REDIRECT_URI = 'https://developers.google.com/oauthplayground';

// Create OAuth2 client
const createOAuth2Client = (): OAuth2Client => {
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: GMAIL_REFRESH_TOKEN
  });

  return oauth2Client;
};

// Gmail service interface
export const gmailService = {
  /**
   * Fetch recent emails from the Gmail inbox
   */
  async fetchEmails(maxResults = 10) {
    try {
      // Create authenticated client
      const auth = createOAuth2Client();
      const gmail = google.gmail({ version: 'v1', auth });
      
      // Fetch message list
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'is:unread', // Only unread messages
      });

      const messages = response.data.messages || [];
      const emails = [];

      // Fetch detailed content for each message
      for (const message of messages.slice(0, maxResults)) {
        if (message.id) {
          const email = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });
          
          emails.push({
            id: email.data.id,
            threadId: email.data.threadId,
            snippet: email.data.snippet,
            headers: this.extractHeaders(email.data),
            body: this.extractBody(email.data),
          });
        }
      }

      return {
        success: true,
        data: { emails }
      };
    } catch (error) {
      console.error('Error fetching emails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Parse email content for job request details
   */
  async parseEmailContent(emailId: string) {
    try {
      const auth = createOAuth2Client();
      const gmail = google.gmail({ version: 'v1', auth });
      
      // Fetch full email content
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
      });
      
      const headers = this.extractHeaders(email.data);
      const body = this.extractBody(email.data);
      
      // Parse the content for job-related information
      const parsed = this.extractJobInfo(body, headers);
      
      return {
        success: true,
        data: {
          emailId,
          subject: headers.subject,
          from: headers.from,
          parsed
        }
      };
    } catch (error) {
      console.error('Error parsing email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Extract headers from Gmail message
   */
  extractHeaders(message: any) {
    const headers: { [key: string]: string } = {};
    
    if (message.payload && message.payload.headers) {
      for (const header of message.payload.headers) {
        if (header.name && header.value) {
          headers[header.name.toLowerCase()] = header.value;
        }
      }
    }
    
    return {
      subject: headers.subject || '',
      from: headers.from || '',
      to: headers.to || '',
      date: headers.date || '',
    };
  },

  /**
   * Extract email body from Gmail message
   */
  extractBody(message: any) {
    let body = '';
    
    if (message.payload) {
      if (message.payload.body && message.payload.body.data) {
        // Base64 decode the body
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      } else if (message.payload.parts) {
        // Look for text/plain or text/html parts
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body && part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          } else if (part.mimeType === 'text/html' && part.body && part.body.data) {
            const htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            // Convert HTML to plain text (simplified)
            body = htmlBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            break;
          }
        }
      }
    }
    
    return body;
  },

  /**
   * Extract job information from email content
   */
  extractJobInfo(body: string, headers: any) {
    // Patterns to look for in email content
    const addressPattern = /\b\d+\s+[A-Za-z0-9\s,\.]+(?:Road|Rd|Street|St|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd|Highway|Hwy|Court|Ct|Circle|Cir|Place|Pl|Terrace|Ter|Way)\b/gi;
    const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const namePattern = /(?:my name is|from)\s+([A-Za-z\s]{2,30})/i;
    const datePattern = /(?:on|for|by|date)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i;
    
    // Extract matches
    const addresses = body.match(addressPattern) || [];
    const phones = body.match(phonePattern) || [];
    const nameMatch = body.match(namePattern);
    const dateMatch = body.match(datePattern);
    
    // Extract customer name from email if not found in body
    let customerName = '';
    if (nameMatch && nameMatch[1]) {
      customerName = nameMatch[1].trim();
    } else if (headers.from) {
      const fromMatch = headers.from.match(/(?:"?([^"<]+)"?\s+)?<?([^@>]+)@[^>]+>?/);
      customerName = fromMatch && fromMatch[1] ? fromMatch[1].trim() : '';
    }
    
    // Determine if this is a quote request
    const isQuoteRequest = 
      body.toLowerCase().includes('quote') || 
      body.toLowerCase().includes('estimate') ||
      body.toLowerCase().includes('price') ||
      headers.subject.toLowerCase().includes('quote') ||
      headers.subject.toLowerCase().includes('estimate') ||
      headers.subject.toLowerCase().includes('price');
    
    // Determine urgency
    const urgencyTerms = ['urgent', 'asap', 'as soon as possible', 'tomorrow', 'today', 'emergency'];
    const urgencyFound = urgencyTerms.some(term => body.toLowerCase().includes(term));
    
    return {
      customerName,
      address: addresses.length > 0 ? addresses[0] : '',
      phone: phones.length > 0 ? phones[0] : '',
      requestType: isQuoteRequest ? 'Quote Request' : 'General Inquiry',
      requestedDate: dateMatch ? dateMatch[1] : '',
      urgency: urgencyFound ? 'High' : 'Normal',
      confidence: this.calculateConfidence(customerName, addresses, phones),
    };
  },

  /**
   * Calculate confidence score for parsed information
   */
  calculateConfidence(name: string, addresses: string[], phones: string[]) {
    let score = 0;
    
    if (name) score += 0.3;
    if (addresses.length > 0) score += 0.4;
    if (phones.length > 0) score += 0.3;
    
    return Math.min(score, 1.0);
  }
}; 