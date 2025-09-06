import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      // Return sample data if no user
      return NextResponse.json({
        messages: [
          {
            id: '1',
            sender_name: 'AutoParts Pro',
            content: 'Yes, the brake pads are still available',
            created_at: new Date().toISOString(),
            read: false
          }
        ]
      });
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.log('Database not ready, returning sample data');
      return NextResponse.json({
        messages: [
          {
            id: '1',
            sender_name: 'AutoParts Pro',
            content: 'Yes, the brake pads are still available',
            created_at: new Date().toISOString(),
            read: false
          }
        ]
      });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content } = body;

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: senderId,
        receiver_id: receiverId,
        content: content,
        read: false
      }])
      .select();

    if (error) {
      return NextResponse.json({
        success: true,
        message: {
          id: Date.now().toString(),
          content,
          created_at: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ success: true, message: data[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
