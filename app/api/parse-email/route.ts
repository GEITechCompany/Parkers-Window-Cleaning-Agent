import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The schema we want the AI to extract
const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    customerName: { type: "string" },
    phone: { type: "string" },
    email: { type: "string" },
    address: { type: "string" },
    service: { type: "string" },
    preferredDate: { type: "string" },
    alternativeDates: { type: "array", items: { type: "string" } },
    notes: { type: "string" }
  },
  required: ["customerName", "phone", "email", "address", "service", "preferredDate"]
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailContent } = body;

    if (!emailContent) {
      return NextResponse.json({ error: 'Email content is required' }, { status: 400 });
    }

    // Use OpenAI to extract structured information
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts scheduling information from emails for a window cleaning business. 
          Extract ONLY the information requested in the schema. If information is missing, leave the field empty or null.
          For dates, convert them to YYYY-MM-DD format if possible.`
        },
        {
          role: "user",
          content: `Extract scheduling information from this email: ${emailContent}`
        }
      ],
      functions: [
        {
          name: "extractSchedulingInfo",
          description: "Extract scheduling information from email content",
          parameters: EXTRACTION_SCHEMA
        }
      ],
      function_call: { name: "extractSchedulingInfo" }
    });

    // Get the response from OpenAI
    const functionCall = response.choices[0].message.function_call;
    if (!functionCall) {
      return NextResponse.json({ error: 'Failed to extract information' }, { status: 500 });
    }

    const extractedData = JSON.parse(functionCall.arguments);

    return NextResponse.json({ 
      data: extractedData,
      confidence: estimateConfidence(extractedData)
    });

  } catch (error: any) {
    console.error('Error parsing email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse email' },
      { status: 500 }
    );
  }
}

// Estimate confidence based on how many required fields are filled
function estimateConfidence(data: any): number {
  const requiredFields = ["customerName", "phone", "email", "address", "service", "preferredDate"];
  const filledRequiredFields = requiredFields.filter(field => 
    data[field] && data[field].toString().trim() !== ''
  );
  
  return Number((filledRequiredFields.length / requiredFields.length).toFixed(2));
} 