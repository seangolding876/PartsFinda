// app/api/admin/successful-requests/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const successfulRequests = await query(`
      SELECT 
        pr.id as request_id,
        pr.part_name,
        pr.budget,
        pr.created_at as request_created,
        pr.status as request_status,
        
        -- Buyer details
        buyer.id as buyer_id,
        buyer.name as buyer_name,
        buyer.email as buyer_email,
        buyer.phone as buyer_phone,
        
        -- Seller details (multiple sellers for one request)
        rq.seller_id,
        seller.name as seller_name,
        seller.email as seller_email,
        seller.business_name,
        seller.membership_plan,
        
        -- Queue status
        rq.status as queue_status,
        rq.scheduled_delivery_time,
        rq.processed_at,
        
        -- Quote details (if any)
        quote.id as quote_id,
        quote.price as quoted_price,
        quote.availability,
        quote.delivery_time as quoted_delivery,
        quote.status as quote_status,
        quote.created_at as quote_created,
        
        -- Conversation details (if any)
        conv.id as conversation_id,
        msg.id as message_id,
        msg.created_at as last_message_time
        
      FROM part_requests pr
      
      -- Join with request_queue to see which sellers got the request
      INNER JOIN request_queue rq ON pr.id = rq.part_request_id
      
      -- Buyer details
      INNER JOIN users buyer ON pr.user_id = buyer.id
      
      -- Seller details  
      INNER JOIN users seller ON rq.seller_id = seller.id
      
      -- Left join with quotes (seller response)
      LEFT JOIN request_quotes quote ON pr.id = quote.request_id AND seller.id = quote.seller_id
      
      -- Left join with conversations
      LEFT JOIN conversations conv ON pr.id = conv.part_request_id AND seller.id = conv.seller_id
      
      -- Left join with messages to check if chat started
      LEFT JOIN messages msg ON conv.id = msg.conversation_id
      
      WHERE rq.status = 'processed'
      ORDER BY pr.created_at DESC, seller.name ASC
    `);

    // Group by request to show all sellers for each request
    const groupedData = successfulRequests.rows.reduce((acc, row) => {
      const requestId = row.request_id;
      
      if (!acc[requestId]) {
        acc[requestId] = {
          request_id: requestId,
          part_name: row.part_name,
          budget: row.budget,
          request_created: row.request_created,
          request_status: row.request_status,
          buyer: {
            id: row.buyer_id,
            name: row.buyer_name,
            email: row.buyer_email,
            phone: row.buyer_phone
          },
          sellers: []
        };
      }
      
      // Add seller details
      acc[requestId].sellers.push({
        seller_id: row.seller_id,
        seller_name: row.seller_name,
        business_name: row.business_name,
        membership_plan: row.membership_plan,
        queue_status: row.queue_status,
        processed_at: row.processed_at,
        
        // Quote details
        has_quote: !!row.quote_id,
        quoted_price: row.quoted_price,
        quote_status: row.quote_status,
        quote_created: row.quote_created,
        
        // Conversation details
        has_conversation: !!row.conversation_id,
        has_messages: !!row.message_id,
        last_message_time: row.last_message_time
      });
      
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: Object.values(groupedData),
      total: successfulRequests.rows.length
    });

  } catch (error: any) {
    console.error('Error fetching successful requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}