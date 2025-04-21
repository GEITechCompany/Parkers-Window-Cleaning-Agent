import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import { Job } from '@/app/types';

// GET all jobs
export async function GET() {
  try {
    // Simulate fetching from Supabase
    // In production, this would be:
    // const { data, error } = await supabase.from('jobs').select('*');
    
    // For MVP, just return mock data
    const mockJobs: Job[] = [
      { id: '1', team_id: '1', job_name: 'Window cleaning for Smith residence', date: '2025-05-01', status: 'scheduled', created_at: new Date().toISOString() },
      { id: '2', team_id: '2', job_name: 'Full house service for Johnson property', date: '2025-05-02', status: 'scheduled', created_at: new Date().toISOString() },
    ];
    
    return NextResponse.json(mockJobs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// POST a new job
export async function POST(request: Request) {
  try {
    const job: Job = await request.json();
    
    // Simulate saving to Supabase
    // In production:
    // const { data, error } = await supabase.from('jobs').insert(job).select();
    
    // For MVP, just return the job with a mock ID
    const mockResponse = {
      ...job,
      id: Math.floor(Math.random() * 1000).toString(),
      created_at: new Date().toISOString()
    };
    
    return NextResponse.json(mockResponse, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
} 