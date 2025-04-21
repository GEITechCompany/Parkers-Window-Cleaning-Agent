import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OAuth client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Initialize Calendar client
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export async function POST(request: Request) {
  try {
    const { 
      jobRequestId,
      scheduledDate,
      scheduledTime,
      estimatedDuration,
      assignedStaff,
      jobDetails,
      status = 'scheduled'
    } = await request.json();

    if (!jobRequestId || !scheduledDate || !scheduledTime || !estimatedDuration) {
      return NextResponse.json(
        { error: 'Missing required job information' },
        { status: 400 }
      );
    }

    // Fetch the job request details from the database
    const { data: jobRequest, error: fetchError } = await supabase
      .from('job_requests')
      .select('*')
      .eq('id', jobRequestId)
      .single();

    if (fetchError) {
      console.error('Error fetching job request:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch job request details' },
        { status: 500 }
      );
    }

    // Parse date and time information
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    
    // Create start and end date objects
    const startDateTime = new Date(year, month - 1, day, hours, minutes);
    const endDateTime = new Date(startDateTime.getTime() + estimatedDuration * 60 * 60 * 1000); // Convert hours to milliseconds
    
    // Format dates for Google Calendar
    const startTimeISO = startDateTime.toISOString();
    const endTimeISO = endDateTime.toISOString();

    // Create a calendar event
    const event = {
      summary: `Window Cleaning - ${jobRequest.customer_name}`,
      location: jobRequest.address,
      description: `
        Service: ${jobRequest.service_type}
        Customer: ${jobRequest.customer_name}
        Email: ${jobRequest.customer_email}
        Special Instructions: ${jobRequest.special_instructions || 'None'}
        Estimated Size: ${jobRequest.estimated_size || 'Not specified'}
        Assigned Staff: ${assignedStaff || 'TBD'}
        Additional Details: ${jobDetails || 'None'}
      `,
      start: {
        dateTime: startTimeISO,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endTimeISO,
        timeZone: 'America/New_York',
      },
      attendees: assignedStaff ? [{ email: assignedStaff }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    // Add the event to Google Calendar
    const calendarResponse = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // Update the job request status and add scheduling details in the database
    const { data: updatedJob, error: updateError } = await supabase
      .from('scheduled_jobs')
      .insert({
        job_request_id: jobRequestId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        estimated_duration: estimatedDuration,
        assigned_staff: assignedStaff,
        calendar_event_id: calendarResponse.data.id,
        status: status,
        job_details: jobDetails,
        created_at: new Date().toISOString()
      })
      .select();

    // Update the job request status to 'scheduled'
    await supabase
      .from('job_requests')
      .update({ status: 'scheduled' })
      .eq('id', jobRequestId);

    if (updateError) {
      console.error('Error updating job details:', updateError);
      return NextResponse.json(
        { error: 'Failed to update job details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scheduledJob: updatedJob[0],
      calendarEvent: calendarResponse.data
    });
    
  } catch (error) {
    console.error('Error scheduling job:', error);
    return NextResponse.json(
      { error: 'Failed to schedule job' },
      { status: 500 }
    );
  }
} 