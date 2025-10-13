import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';
import { generateVerificationToken } from '@/lib/email-verification';

interface SellerRegistrationData {
  // Personal Information
  ownerName: string;
  email: string;
  phone: string;
  password: string;

  // Business Information
  businessName: string;
  businessType: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  yearsInBusiness: string;

  // Location & Contact
  address: string;
  parish: string;
  city: string;
  postalCode?: string;
  businessPhone: string;
  businessEmail?: string;
  website?: string;

  // Specializations
  specializations: string[];
  vehicleBrands: string[];

  // Membership Plan
  membershipPlan: string;

  // Terms & Verification
  agreeToTerms: boolean;
  agreeToVerification: boolean;
}
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const body: SellerRegistrationData = await request.json();
    
    console.log('📝 Seller registration request received');

    // Validate required fields
    const requiredFields = [
      'ownerName', 'email', 'phone', 'password',
      'businessName', 'businessType', 'yearsInBusiness',
      'address', 'parish', 'city', 'businessPhone',
      'membershipPlan', 'agreeToTerms', 'agreeToVerification'
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof SellerRegistrationData]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [body.email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if business name already exists
    const existingBusiness = await query(
      'SELECT id FROM sellers WHERE business_name = $1',
      [body.businessName]
    );

    if (existingBusiness.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Business name already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Start transaction
    await query('BEGIN');

    try {
      // Create user account
      const userResult = await query(
        `INSERT INTO users (
          email, password, name, phone, role, email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          body.email,
          hashedPassword,
          body.ownerName,
          body.phone,
          'seller',
          false
        ]
      );

      const userId = userResult.rows[0].id;

      // Create seller profile
      const sellerResult = await query(
        `INSERT INTO sellers (
          user_id, business_name, business_type, business_registration_number,
          tax_id, years_in_business, address, parish, city, postal_code,
          business_phone, business_email, website, specializations,
          vehicle_brands, membership_plan, status, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id, business_name, status, verification_status`,
        [
          userId,
          body.businessName,
          body.businessType,
          body.businessRegistrationNumber || null,
          body.taxId || null,
          body.yearsInBusiness,
          body.address,
          body.parish,
          body.city,
          body.postalCode || null,
          body.businessPhone,
          body.businessEmail || null,
          body.website || null,
          JSON.stringify(body.specializations),
          JSON.stringify(body.vehicleBrands),
          body.membershipPlan,
          'pending', // Initial status
          'unverified' // Initial verification status
        ]
      );

      await query('COMMIT');

      const seller = sellerResult.rows[0];

      // Send welcome email to seller
      await sendEmail({
        to: body.email,
        subject: 'Welcome to PartFinda Jamaica - Seller Application Received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">PartFinda Jamaica</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Auto Parts Marketplace</p>
            </div>
            
            <div style="padding: 30px; background: #ffffff;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to PartFinda, ${body.ownerName}!</h2>
              
              <p style="color: #4b5563; line-height: 1.6;">
                Thank you for your interest in becoming a verified supplier on PartFinda Jamaica. 
                Your seller application has been received and is currently under review.
              </p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1f2937; margin-bottom: 15px;">Application Details:</h3>
                <p><strong>Business Name:</strong> ${body.businessName}</p>
                <p><strong>Application ID:</strong> PF-S${seller.id.toString().padStart(6, '0')}</p>
                <p><strong>Status:</strong> Under Review</p>
                <p><strong>Membership Plan:</strong> ${body.membershipPlan.charAt(0).toUpperCase() + body.membershipPlan.slice(1)}</p>
              </div>
              
              <p style="color: #4b5563; line-height: 1.6;">
                Our team will review your application within 2-3 business days. Once approved, 
                you'll gain access to your seller dashboard where you can start listing parts 
                and connecting with customers across Jamaica.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Next Steps: Application Review
                </div>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                If you have any questions, please contact our support team at 
                <a href="mailto:support@partfinda.jm" style="color: #2563eb;"> support@partfinda.jm</a>
              </p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
              <p>&copy; 2024 PartFinda Jamaica. All rights reserved.</p>
              <p>Connecting auto parts suppliers with customers across Jamaica</p>
            </div>
          </div>
        `
      });

      // Send notification to admin (optional)
      await sendEmail({
        to: 'admin@partfinda.jm', // Replace with actual admin email
        subject: 'New Seller Application - PartFinda Jamaica',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>New Seller Application Received</h2>
            <p><strong>Business:</strong> ${body.businessName}</p>
            <p><strong>Owner:</strong> ${body.ownerName}</p>
            <p><strong>Email:</strong> ${body.email}</p>
            <p><strong>Phone:</strong> ${body.phone}</p>
            <p><strong>Location:</strong> ${body.city}, ${body.parish}</p>
            <p><strong>Application ID:</strong> PF-S${seller.id.toString().padStart(6, '0')}</p>
          </div>
        `
      });

      console.log('✅ Seller registration completed successfully');

      return NextResponse.json({
        success: true,
        message: 'Seller application submitted successfully. Please check your email for confirmation.',
        data: {
          applicationId: `PF-S${seller.id.toString().padStart(6, '0')}`,
          businessName: seller.business_name,
          status: seller.status,
          nextSteps: 'Our team will review your application within 2-3 business days.'
        }
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('❌ Seller registration error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process seller registration',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}