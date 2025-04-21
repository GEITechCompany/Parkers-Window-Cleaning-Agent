import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import { Notification } from '@/app/types';

// GET all notifications
export async function GET() {
  try {
    // Simulate fetching from Supabase
    // In production, this would be:
    // const { data, error } = await supabase.from('notifications').select('*');
    
    // For MVP, just return mock data
    const mockNotifications: Notification[] = [
      { id: '1', message: 'Job #123 scheduled for Team A', created_at: new Date().toISOString(), read: false },
      { id: '2', message: 'Estimate sent to John Doe', created_at: new Date().toISOString(), read: true },
    ];
    
    return NextResponse.json(mockNotifications);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST a new notification
export async function POST(request: Request) {
  try {
    const notification: Notification = await request.json();
    
    // Simulate saving to Supabase
    // In production:
    // const { data, error } = await supabase.from('notifications').insert(notification).select();
    
    // For MVP, just return the notification with a mock ID
    const mockResponse = {
      ...notification,
      id: Math.floor(Math.random() * 1000).toString(),
      created_at: new Date().toISOString(),
      read: false
    };
    
    return NextResponse.json(mockResponse, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
} 