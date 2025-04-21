import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../utils/supabaseServer';
import { Estimate } from '@/app/types';

// GET all estimates
export async function GET() {
  try {
    // Using the admin client for server-side operations
    const { data, error } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch estimates' },
      { status: 500 }
    );
  }
}

// POST a new estimate
export async function POST(request: Request) {
  try {
    const estimate: Estimate = await request.json();
    
    // Validation
    if (!estimate.name || !estimate.address || !estimate.amount) {
      return NextResponse.json(
        { error: 'Name, address, and amount are required fields' },
        { status: 400 }
      );
    }
    
    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('estimates')
      .insert({
        name: estimate.name,
        address: estimate.address,
        details: estimate.details,
        amount: estimate.amount,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating estimate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create estimate' },
      { status: 500 }
    );
  }
}

// GET a specific estimate by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    const { data, error } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
      }
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch estimate' },
      { status: 500 }
    );
  }
}

// PATCH to update an estimate
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const updates = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('estimates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
      }
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating estimate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update estimate' },
      { status: 500 }
    );
  }
} 