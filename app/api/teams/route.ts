import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import { Team } from '@/app/types';

// GET all teams
export async function GET() {
  try {
    // Simulate fetching from Supabase
    // In production, this would be:
    // const { data, error } = await supabase.from('teams').select('*');
    
    // For MVP, just return mock data
    const mockTeams: Team[] = [
      { id: '1', name: 'Team A', members: ['John', 'Sarah'] },
      { id: '2', name: 'Team B', members: ['Mike', 'Lisa'] },
      { id: '3', name: 'Team C', members: ['Dave', 'Emily'] },
    ];
    
    return NextResponse.json(mockTeams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
} 