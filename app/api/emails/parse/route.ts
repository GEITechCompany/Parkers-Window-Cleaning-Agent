import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { emailId, subject, from, body } = await request.json();

    if (!emailId || !subject || !from || !body) {
      return NextResponse.json(
        { error: 'Missing required email information' },
        { status: 400 }
      );
    }

    // Extract name and email from 'from' field (typically in format "Name <email@example.com>")
    const nameMatch = from.match(/^(.*?)\s*<.*>$/);
    const emailMatch = from.match(/<(.+?)>/);
    
    const customerName = nameMatch ? nameMatch[1].trim() : 'Unknown';
    const customerEmail = emailMatch ? emailMatch[1].trim() : from.trim();

    // Use OpenAI to extract relevant information from the email body
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for Parker's Window Cleaning. 
          Extract the following information from the customer email:
          - Service requested (window cleaning, gutter cleaning, etc.)
          - Property details (address, type of building)
          - Requested date/timeframe
          - Any special instructions or requirements
          - Estimated square footage or size of job
          
          Format your response as a JSON object with the following structure:
          {
            "service": "string",
            "address": "string",
            "dateRequested": "string",
            "specialInstructions": "string",
            "estimatedSize": "string",
            "confidence": number (0-100)
          }
          
          If any field is not found in the email, use null for that field value.
          For confidence, estimate how confident you are about the extracted information overall.`
        },
        {
          role: "user",
          content: `Email Subject: ${subject}\n\nEmail Body: ${body}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysisResult = JSON.parse(completion.choices[0].message.content);
    
    // Create a potential job request record in the database
    const { data, error } = await supabase
      .from('job_requests')
      .insert({
        email_id: emailId,
        customer_name: customerName,
        customer_email: customerEmail,
        service_type: analysisResult.service,
        address: analysisResult.address,
        requested_date: analysisResult.dateRequested,
        special_instructions: analysisResult.specialInstructions,
        estimated_size: analysisResult.estimatedSize,
        confidence_score: analysisResult.confidence,
        status: 'pending',
        email_subject: subject,
        email_body: body,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error saving job request:', error);
      return NextResponse.json(
        { error: 'Failed to save job request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobRequest: data[0],
      analysis: analysisResult
    });
    
  } catch (error) {
    console.error('Error parsing email:', error);
    return NextResponse.json(
      { error: 'Failed to parse email' },
      { status: 500 }
    );
  }
} 