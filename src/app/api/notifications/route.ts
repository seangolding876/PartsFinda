import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mock email service - replace with actual Resend in production
class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || 'mock_api_key';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@partsfinda.com';
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (this.apiKey === 'mock_api_key') {
      // Mock email sending for development
      console.log(`📧 Mock Email Sent:`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML: ${html}`);
      return { success: true, messageId: `mock_${Date.now()}` };
    }

    try {
      // In production, use actual Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }
}

interface PartRequest {
  id: string;
  partName: string;
  partNumber?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  description: string;
  budget?: number;
  urgency: 'low' | 'medium' | 'high';
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  location?: string;
}

interface Seller {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'basic' | 'silver' | 'gold';
  location?: string;
  specialties?: string[];
  emailNotifications: boolean;
  dailyEmailLimit: number;
  emailsSentToday: number;
}

// Mock seller database with subscription tiers
const mockSellers: Seller[] = [
  {
    id: '1',
    name: 'AutoParts Pro',
    email: 'sales@autopartspro.com',
    subscriptionTier: 'gold',
    location: 'California, USA',
    specialties: ['Toyota', 'Honda', 'Nissan'],
    emailNotifications: true,
    dailyEmailLimit: 50,
    emailsSentToday: 5
  },
  {
    id: '2',
    name: 'Premium Parts Supply',
    email: 'info@premiumparts.com',
    subscriptionTier: 'silver',
    location: 'Texas, USA',
    specialties: ['Ford', 'Chevrolet', 'BMW'],
    emailNotifications: true,
    dailyEmailLimit: 25,
    emailsSentToday: 8
  },
  {
    id: '3',
    name: 'Budget Auto Parts',
    email: 'contact@budgetauto.com',
    subscriptionTier: 'basic',
    location: 'Florida, USA',
    specialties: ['Universal Parts'],
    emailNotifications: true,
    dailyEmailLimit: 10,
    emailsSentToday: 3
  },
  {
    id: '4',
    name: 'European Auto Specialists',
    email: 'parts@europeanspecialists.com',
    subscriptionTier: 'gold',
    location: 'New York, USA',
    specialties: ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen'],
    emailNotifications: true,
    dailyEmailLimit: 50,
    emailsSentToday: 12
  },
  {
    id: '5',
    name: 'Truck Parts Depot',
    email: 'sales@truckpartsdepot.com',
    subscriptionTier: 'silver',
    location: 'Ohio, USA',
    specialties: ['Ford F-Series', 'Chevrolet Silverado', 'Ram'],
    emailNotifications: true,
    dailyEmailLimit: 25,
    emailsSentToday: 2
  }
];

function getSellerPriority(tier: string): number {
  switch (tier) {
    case 'gold': return 1;
    case 'silver': return 2;
    case 'basic': return 3;
    default: return 4;
  }
}

function getRelevantSellers(partRequest: PartRequest): Seller[] {
  return mockSellers
    .filter(seller => {
      // Check if seller has email notifications enabled
      if (!seller.emailNotifications) return false;

      // Check daily email limit
      if (seller.emailsSentToday >= seller.dailyEmailLimit) return false;

      // Check if seller specializes in the vehicle make
      if (seller.specialties?.includes(partRequest.vehicleMake)) return true;

      // Include sellers with universal parts or no specialties
      if (seller.specialties?.includes('Universal Parts') || !seller.specialties?.length) return true;

      return false;
    })
    .sort((a, b) => {
      // Sort by subscription tier priority
      const priorityA = getSellerPriority(a.subscriptionTier);
      const priorityB = getSellerPriority(b.subscriptionTier);
      return priorityA - priorityB;
    });
}

function generateEmailContent(partRequest: PartRequest, seller: Seller): { subject: string; html: string } {
  const urgencyColor = {
    low: '#10B981',    // Green
    medium: '#F59E0B', // Amber
    high: '#EF4444'    // Red
  };

  const urgencyText = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority - Urgent'
  };

  const subject = `New Part Request: ${partRequest.partName} for ${partRequest.vehicleYear} ${partRequest.vehicleMake} ${partRequest.vehicleModel}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Part Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🔧 PartsFinda</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">New Part Request Available</p>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #495057; margin-top: 0; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Part Request Details</h2>

          <div style="background: ${urgencyColor[partRequest.urgency]}; color: white; padding: 8px 15px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; font-size: 14px;">
            ${urgencyText[partRequest.urgency]}
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; width: 40%;">Part Name:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${partRequest.partName}</td>
            </tr>
            ${partRequest.partNumber ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">Part Number:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${partRequest.partNumber}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">Vehicle:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${partRequest.vehicleYear} ${partRequest.vehicleMake} ${partRequest.vehicleModel}</td>
            </tr>
            ${partRequest.budget ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">Budget:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">$${partRequest.budget}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">Description:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${partRequest.description}</td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #495057; margin-top: 0; border-bottom: 2px solid #28a745; padding-bottom: 10px;">Buyer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; width: 30%;">Name:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${partRequest.buyerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">Email:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;"><a href="mailto:${partRequest.buyerEmail}" style="color: #007bff;">${partRequest.buyerEmail}</a></td>
            </tr>
            ${partRequest.buyerPhone ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">Phone:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;"><a href="tel:${partRequest.buyerPhone}" style="color: #007bff;">${partRequest.buyerPhone}</a></td>
            </tr>
            ` : ''}
            ${partRequest.location ? `
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Location:</td>
              <td style="padding: 10px 0;">${partRequest.location}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/seller/dashboard?request=${partRequest.id}"
             style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
            View Full Request & Respond
          </a>
        </div>

        <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin-top: 30px;">
          <h4 style="margin-top: 0; color: #495057;">Why you're receiving this:</h4>
          <p style="margin-bottom: 0; color: #6c757d; font-size: 14px;">
            You're receiving this notification because your ${seller.subscriptionTier} subscription includes part request alerts for ${seller.specialties?.join(', ') || 'all vehicle types'}.
            You can manage your notification preferences in your seller dashboard.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            © 2024 PartsFinda. All rights reserved.<br>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?seller=${seller.id}" style="color: #6c757d;">Unsubscribe</a> |
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/seller/settings" style="color: #6c757d;">Manage Preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'part-request') {
      const partRequest: PartRequest = data;

      // Validate required fields
      if (!partRequest.partName || !partRequest.vehicleMake || !partRequest.vehicleModel || !partRequest.buyerEmail) {
        return NextResponse.json(
          { error: 'Missing required fields for part request notification' },
          { status: 400 }
        );
      }

      // Get relevant sellers based on subscription tier and specialties
      const relevantSellers = getRelevantSellers(partRequest);

      if (relevantSellers.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No eligible sellers found for this part request',
          notificationsSent: 0
        });
      }

      const emailService = new EmailService();
      const results = [];

      // Send notifications to relevant sellers
      for (const seller of relevantSellers) {
        try {
          const { subject, html } = generateEmailContent(partRequest, seller);

          const result = await emailService.sendEmail(seller.email, subject, html);

          results.push({
            sellerId: seller.id,
            sellerName: seller.name,
            email: seller.email,
            success: true,
            messageId: result.messageId
          });

          // Update email count (in production, save to database)
          seller.emailsSentToday += 1;

        } catch (error) {
          console.error(`Failed to send email to ${seller.email}:`, error);
          results.push({
            sellerId: seller.id,
            sellerName: seller.name,
            email: seller.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      // Log notification activity (in production, save to database)
      console.log(`📊 Part Request Notifications Sent:`, {
        partRequestId: partRequest.id,
        totalSellers: relevantSellers.length,
        successfulNotifications: successCount,
        results
      });

      return NextResponse.json({
        success: true,
        message: `Notifications sent to ${successCount} sellers`,
        notificationsSent: successCount,
        totalEligibleSellers: relevantSellers.length,
        results
      });
    }

    return NextResponse.json(
      { error: 'Invalid notification type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Notification service error:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}

// Get notification settings for a seller
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      );
    }

    const seller = mockSellers.find(s => s.id === sellerId);

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        emailNotifications: seller.emailNotifications,
        subscriptionTier: seller.subscriptionTier,
        dailyEmailLimit: seller.dailyEmailLimit,
        emailsSentToday: seller.emailsSentToday,
        specialties: seller.specialties,
        tierLimits: {
          basic: 10,
          silver: 25,
          gold: 50
        }
      }
    });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerId, emailNotifications, specialties } = body;

    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      );
    }

    const sellerIndex = mockSellers.findIndex(s => s.id === sellerId);

    if (sellerIndex === -1) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Update seller preferences
    if (typeof emailNotifications === 'boolean') {
      mockSellers[sellerIndex].emailNotifications = emailNotifications;
    }

    if (Array.isArray(specialties)) {
      mockSellers[sellerIndex].specialties = specialties;
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      settings: {
        emailNotifications: mockSellers[sellerIndex].emailNotifications,
        specialties: mockSellers[sellerIndex].specialties
      }
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
