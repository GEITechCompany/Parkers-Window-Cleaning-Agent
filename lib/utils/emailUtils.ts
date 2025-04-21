/**
 * Email utilities for fetching and parsing emails
 */

/**
 * Interface for email data
 */
export interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

/**
 * Interface for parsed scheduling information
 */
export interface SchedulingInfo {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  service: string;
  preferredDate: string;
  alternativeDates?: string[];
  notes?: string;
}

interface ParsedEmailResponse {
  data: SchedulingInfo;
  confidence: number;
}

/**
 * Fetches emails from the API
 * @returns A promise that resolves to an array of Email objects
 */
export async function fetchEmails(): Promise<Email[]> {
  try {
    const response = await fetch('/api/emails');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch emails');
    }
    
    const data = await response.json();
    return data.emails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

/**
 * Parses an email to extract scheduling information
 * @param emailContent The content of the email
 * @returns A promise that resolves to parsed scheduling information
 */
export async function parseEmail(emailContent: string): Promise<ParsedEmailResponse> {
  try {
    const response = await fetch('/api/parse-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailContent }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to parse email');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error parsing email:', error);
    throw error;
  }
}

/**
 * Fetches emails and parses the most recent one
 * @returns A promise that resolves to parsed scheduling information from the most recent email
 */
export async function fetchAndParseLatestEmail(): Promise<ParsedEmailResponse | null> {
  try {
    const emails = await fetchEmails();
    
    if (emails.length === 0) {
      return null;
    }
    
    // Sort emails by date (newest first)
    const sortedEmails = [...emails].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Parse the most recent email
    return await parseEmail(sortedEmails[0].body);
  } catch (error) {
    console.error('Error fetching and parsing latest email:', error);
    throw error;
  }
}

/**
 * Creates a new job from parsed email data
 * @param schedulingInfo Parsed scheduling information
 * @returns A promise that resolves to the created job
 */
export async function createJobFromEmail(schedulingInfo: SchedulingInfo) {
  try {
    // This is a placeholder - implementation would depend on your job creation API
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schedulingInfo),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create job from email');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating job from email:', error);
    throw error;
  }
} 