import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GMAIL_EMAIL,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

// Status-specific email content
const statusEmailContent = {
  confirmed: {
    subject: 'Job Confirmed: Window Cleaning Service',
    body: (customerName: string, date: string, time: string) => `
      <h2>Your Window Cleaning Service is Confirmed</h2>
      <p>Dear ${customerName},</p>
      <p>We're pleased to confirm your window cleaning service has been scheduled for <strong>${date}</strong> at <strong>${time}</strong>.</p>
      <p>Our team will arrive within a 30-minute window of the scheduled time. We'll contact you if there are any changes to the schedule.</p>
      <p>If you need to make any changes to your appointment, please contact us at least 24 hours in advance.</p>
      <p>Thank you for choosing Parker's Window Cleaning!</p>
      <p>Best regards,<br>Parker's Window Cleaning Team</p>
    `
  },
  completed: {
    subject: 'Job Completed: Window Cleaning Service',
    body: (customerName: string) => `
      <h2>Your Window Cleaning Service is Complete</h2>
      <p>Dear ${customerName},</p>
      <p>We're pleased to inform you that your window cleaning service has been completed.</p>
      <p>Thank you for choosing Parker's Window Cleaning. We hope you're satisfied with our service!</p>
      <p>If you have a moment, we would appreciate your feedback or a review of our service.</p>
      <p>Best regards,<br>Parker's Window Cleaning Team</p>
    `
  },
  cancelled: {
    subject: 'Job Cancelled: Window Cleaning Service',
    body: (customerName: string) => `
      <h2>Your Window Cleaning Service Has Been Cancelled</h2>
      <p>Dear ${customerName},</p>
      <p>We're writing to confirm that your window cleaning service has been cancelled as requested.</p>
      <p>If you'd like to reschedule, please don't hesitate to contact us.</p>
      <p>Thank you for considering Parker's Window Cleaning.</p>
      <p>Best regards,<br>Parker's Window Cleaning Team</p>
    `
  },
  rescheduled: {
    subject: 'Job Rescheduled: Window Cleaning Service',
    body: (customerName: string, date: string, time: string) => `
      <h2>Your Window Cleaning Service Has Been Rescheduled</h2>
      <p>Dear ${customerName},</p>
      <p>We're writing to confirm that your window cleaning service has been rescheduled to <strong>${date}</strong> at <strong>${time}</strong>.</p>
      <p>If this new time does not work for you, please contact us as soon as possible.</p>
      <p>Thank you for your flexibility and for choosing Parker's Window Cleaning.</p>
      <p>Best regards,<br>Parker's Window Cleaning Team</p>
    `
  }
};

export async function PATCH(request: Request) {
  try {
    const { 
      jobId, 
      newStatus, 
      notes = '',
      notifyCustomer = true
    } = await request.json();

    if (!jobId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required information' },
        { status: 400 }
      );
    }

    // Valid status values
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Fetch the current job to get associated job request
    const { data: job, error: jobError } = await supabase
      .from('scheduled_jobs')
      .select('*, job_request_id')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error('Error fetching job:', jobError);
      return NextResponse.json(
        { error: 'Failed to fetch job details' },
        { status: 500 }
      );
    }

    // Fetch customer details from job request
    const { data: jobRequest, error: requestError } = await supabase
      .from('job_requests')
      .select('customer_name, customer_email')
      .eq('id', job.job_request_id)
      .single();

    if (requestError) {
      console.error('Error fetching job request:', requestError);
      return NextResponse.json(
        { error: 'Failed to fetch customer details' },
        { status: 500 }
      );
    }

    // Update job status
    const { data: updatedJob, error: updateError } = await supabase
      .from('scheduled_jobs')
      .update({
        status: newStatus,
        notes: notes ? `${job.notes ? job.notes + '\n' : ''}${new Date().toISOString()}: ${notes}` : job.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select();

    if (updateError) {
      console.error('Error updating job status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update job status' },
        { status: 500 }
      );
    }

    // Send notification email if required
    if (notifyCustomer && ['confirmed', 'completed', 'cancelled', 'rescheduled'].includes(newStatus)) {
      const emailContent = statusEmailContent[newStatus as keyof typeof statusEmailContent];
      
      let emailBody;
      if (newStatus === 'confirmed' || newStatus === 'rescheduled') {
        // Format date for email
        const dateObj = new Date(job.scheduled_date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        
        emailBody = emailContent.body(
          jobRequest.customer_name, 
          formattedDate, 
          job.scheduled_time
        );
      } else {
        emailBody = emailContent.body(jobRequest.customer_name);
      }

      try {
        await transporter.sendMail({
          from: `"Parker's Window Cleaning" <${process.env.GMAIL_EMAIL}>`,
          to: jobRequest.customer_email,
          subject: emailContent.subject,
          html: emailBody,
        });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // Continue with the status update even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      updatedJob: updatedJob[0]
    });
    
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { error: 'Failed to update job status' },
      { status: 500 }
    );
  }
} 