// app/api/quotes/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import smsQueueService from '@/lib/sms-queue-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    
    const { quoteId } = await request.json();
    
    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Start transaction
    await query('BEGIN');

    // 1. Verify quote exists and belongs to buyer
    const quoteCheck = await query(
      `SELECT rq.*, pr.user_id as buyer_id, pr.part_name, 
              u.name as buyer_name, rq.seller_id, s.name as seller_name,
              s.email as seller_email, m.name as make_name, md.name as model_name,
              pr.vehicle_year, pr.id as request_id
       FROM request_quotes rq
       INNER JOIN part_requests pr ON rq.request_id = pr.id
       INNER JOIN users u ON pr.user_id = u.id
       INNER JOIN users s ON rq.seller_id = s.id
       LEFT JOIN makes m ON pr.make_id = m.id
       LEFT JOIN models md ON pr.model_id = md.id
       WHERE rq.id = $1 AND pr.user_id = $2`,
      [quoteId, userInfo.userId]
    );

    if (quoteCheck.rows.length === 0) {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Quote not found or unauthorized' },
        { status: 404 }
      );
    }

    const quote = quoteCheck.rows[0];

    // 2. Update quote status to 'accepted'
    await query(
      'UPDATE request_quotes SET status = $1 WHERE id = $2',
      ['accepted', quoteId]
    );

    // 3. Update part request status to 'fulfilled'
    await query(
      'UPDATE part_requests SET status = $1 WHERE id = $2',
      ['fulfilled', quote.request_id]
    );

    // 4. Reject all other quotes for this request
    await query(
      'UPDATE request_quotes SET status = $1 WHERE request_id = $2 AND id != $3',
      ['rejected', quote.request_id, quoteId]
    );

    // 5. Create BUYER notification
    await query(
      `INSERT INTO notifications 
       (user_id, part_request_id, title, message, type, user_type) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userInfo.userId,
        quote.request_id,
        'Quote Accepted Successfully',
        `You have accepted the quote for ${quote.part_name} from ${quote.seller_name} at J$${quote.price}`,
        'quote_accepted',
        'buyer'
      ]
    );

    // 6. Create SELLER notification
    await query(
      `INSERT INTO notifications 
       (user_id, part_request_id, title, message, type, user_type) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        quote.seller_id,
        quote.request_id,
        'Your Quote Was Accepted!',
        `${quote.buyer_name} has accepted your quote for ${quote.part_name} at J$${quote.price}`,
        'quote_accepted',
        'seller'
      ]
    );

    // 7. Create conversation AND ensure participants are added
    const existingConv = await query(
      'SELECT id FROM conversations WHERE part_request_id = $1 AND buyer_id = $2 AND seller_id = $3',
      [quote.request_id, userInfo.userId, quote.seller_id]
    );

    let conversationId;
    if (existingConv.rows.length === 0) {
      // Create new conversation
      const newConv = await query(
        `INSERT INTO conversations (part_request_id, buyer_id, seller_id) 
         VALUES ($1, $2, $3) RETURNING id`,
        [quote.request_id, userInfo.userId, quote.seller_id]
      );
      conversationId = newConv.rows[0].id;

      // ✅ CRITICAL: Add BOTH buyer and seller to conversation_participants
      await query(
        `INSERT INTO conversation_participants (conversation_id, user_id) 
         VALUES ($1, $2), ($1, $3)`,
        [conversationId, userInfo.userId, quote.seller_id]
      );
    } else {
      conversationId = existingConv.rows[0].id;

      // Ensure both users are in conversation_participants (for safety)
      const participantCheck = await query(
        `SELECT user_id FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id IN ($2, $3)`,
        [conversationId, userInfo.userId, quote.seller_id]
      );

      const existingUserIds = participantCheck.rows.map((r: any) => r.user_id);
      const valuesToInsert: any[] = [];
      const params: any[] = [conversationId];

      if (!existingUserIds.includes(userInfo.userId)) {
        valuesToInsert.push(`($${params.length + 1})`);
        params.push(userInfo.userId);
      }
      if (!existingUserIds.includes(quote.seller_id)) {
        valuesToInsert.push(`($${params.length + 1})`);
        params.push(quote.seller_id);
      }

      if (valuesToInsert.length > 0) {
        await query(
          `INSERT INTO conversation_participants (conversation_id, user_id) 
           VALUES ${valuesToInsert.join(', ')}`,
          params
        );
      }
    }

    // 8. Send automatic acceptance message
    await query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text, is_read) 
       VALUES ($1, $2, $3, $4, false)`,
      [
        conversationId,
        userInfo.userId,
        quote.seller_id,
        `Hello! I have accepted your quote for ${quote.part_name} at J$${quote.price}. Please let me know the next steps for pickup/delivery.`
      ]
    );

    // 9. Update conversation last message time
    await query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    
// ============= 📱 SMS FOR BUYER =============
try {
  const buyerPhone = await query(
    'SELECT phone FROM users WHERE id = $1',
    [userInfo.userId]
  );
  
  if (buyerPhone.rows[0]?.phone) {
     const buyerMessage = `✅ Hi ${quote.buyer_name}! Your quote request for ${quote.part_name} has been ACCEPTED by ${quote.seller_name} at J$${quote.price}. Check your conversations for next steps.`;
    
    await smsQueueService.queueSms({
      userId: userInfo.userId,
      phone: buyerPhone.rows[0].phone,
      message: buyerMessage,
      type: 'quote_accepted_buyer',
      referenceId: quoteId,
      priority: 'high'
    });
    
    console.log('📱 SMS queued for BUYER');
  }
} catch (smsError) {
  console.error('❌ Failed to queue buyer SMS:', smsError);
  // Don't fail the transaction
}

// ============= 📱 SMS FOR SELLER =============
try {
  const sellerPhone = await query(
    'SELECT phone FROM users WHERE id = $1',
    [quote.seller_id]
  );
  
  if (sellerPhone.rows[0]?.phone) {
    const sellerMessage = `🎉 Congratulations ${quote.seller_name}! Your quote for ${quote.part_name} has been ACCEPTED by ${quote.buyer_name} at J$${quote.price}. Please check your conversations to coordinate delivery.`;
    await smsQueueService.queueSms({
      userId: quote.seller_id,
      phone: sellerPhone.rows[0].phone,
      message: sellerMessage,
      type: 'quote_accepted_seller',
      referenceId: quoteId,
      priority: 'high'
    });
    
    console.log('📱 SMS queued for SELLER');
  }
} catch (smsError) {
  console.error('❌ Failed to queue seller SMS:', smsError);
}

    // Commit transaction
    await query('COMMIT');

    console.log('✅ Quote accepted, conversation created, participants added, and message sent:', quoteId);

    // 10. Optional: Send email to seller
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/email/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quote_accepted',
          userId: quote.seller_id,
          data: {
            partName: quote.part_name,
            price: quote.price,
            buyerName: quote.buyer_name,
            vehicle: `${quote.make_name} ${quote.model_name} (${quote.vehicle_year})`,
            requestId: quote.request_id
          }
        })
      });
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote accepted successfully',
      sellerId: quote.seller_id,
      conversationId
    });

  } catch (error: any) {
    await query('ROLLBACK');
    console.error('❌ Error accepting quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to accept quote' },
      { status: 500 }
    );
  }
}