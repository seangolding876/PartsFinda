import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sendMail } from '@/lib/mailService';

export const dynamic = 'force-dynamic';

interface SellerRegistrationData {
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  businessType: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  yearsInBusiness: string;
  address: string;
  parish: string;
  city: string;
  postalCode?: string;
  businessPhone: string;
  businessEmail?: string;
  website?: string;
  specializations: string[];
  vehicleBrands: string[];
  partCategories: string[];
  businessLicense?: string;
  taxCertificate?: string;
  insuranceCertificate?: string;
  membershipPlan: string;
  agreeToTerms: boolean;
  agreeToVerification: boolean;
}

export async function POST(request: NextRequest) {
  let step = 'initializing';
  
  try {
    step = 'parsing request';
    console.log('🔵 STEP: Parsing request body...');
    
    const body: SellerRegistrationData = await request.json();
    
    console.log('📝 Seller registration request received');
    console.log('📊 Received data summary:', {
      email: body.email,
      businessName: body.businessName,
      ownerName: body.ownerName,
      businessType: body.businessType
    });

    // Validate required fields
    step = 'validating fields';
    console.log('🔵 STEP: Validating required fields...');
    
    const requiredFields = [
      'ownerName', 'email', 'phone', 'password',
      'businessName', 'businessType', 'yearsInBusiness',
      'address', 'parish', 'city', 'businessPhone',
      'membershipPlan', 'agreeToTerms', 'agreeToVerification'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = body[field as keyof SellerRegistrationData];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          step: 'validation',
          missingFields: missingFields
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format',
          step: 'validation'
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must be at least 6 characters long',
          step: 'validation'
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    step = 'checking existing email';
    console.log('🔵 STEP: Checking if email already exists...');
    
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [body.email]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ Email already exists:', body.email);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email already registered. Please use a different email address.',
          step: 'email_check'
        },
        { status: 400 }
      );
    }

    // Check if business name already exists
    step = 'checking existing business';
    console.log('🔵 STEP: Checking if business name already exists...');
    
    const existingBusiness = await query(
      'SELECT id FROM users WHERE business_name = $1',
      [body.businessName]
    );

    if (existingBusiness.rows.length > 0) {
      console.log('❌ Business name already exists:', body.businessName);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Business name already registered. Please use a different business name.',
          step: 'business_check'
        },
        { status: 400 }
      );
    }

    // Hash password
    step = 'hashing password';
    console.log('🔵 STEP: Hashing password...');
    
    const hashedPassword = await bcrypt.hash(body.password, 12);
    console.log('✅ Password hashed successfully');

    // Convert yearsInBusiness to integer
    step = 'processing business data';
    console.log('🔵 STEP: Processing business data...');
    
    const yearsInBusinessMap: { [key: string]: number } = {
      '0-1': 1,
      '1-3': 2,
      '3-5': 4,
      '5-10': 7,
      '10+': 10
    };
    
    const yearsInBusinessInt = yearsInBusinessMap[body.yearsInBusiness] || 1;
    console.log('✅ Years in business converted:', body.yearsInBusiness, '→', yearsInBusinessInt);

    // Generate verification token
    const verificationToken = uuidv4() + Date.now();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Database insertion
    step = 'database insertion';
    console.log('🔵 STEP: Inserting into database...');
    
    const userResult = await query(
      `INSERT INTO users (
        email, password, name, phone, role, owner_name, business_name, 
        business_type, business_registration_number, tax_id, years_in_business,
        address, parish, city, postal_code, business_phone, business_email,
        website, specializations, vehicle_brands, part_categories,
        business_license, tax_certificate, insurance_certificate,
        membership_plan, agree_to_terms, agree_to_verification, 
        email_verified, verification_token, verification_token_expires, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
      RETURNING id, business_name, email, membership_plan, owner_name, status`,
      [
        body.email,
        hashedPassword,
        body.ownerName, // name field
        body.phone,
        'seller',
        body.ownerName, // owner_name field
        body.businessName,
        body.businessType,
        body.businessRegistrationNumber || null,
        body.taxId || null,
        yearsInBusinessInt,
        body.address,
        body.parish,
        body.city,
        body.postalCode || null,
        body.businessPhone,
        body.businessEmail || null,
        body.website || null,
        body.specializations || [],
        body.vehicleBrands || [],
        body.partCategories || [],
        body.businessLicense || null,
        body.taxCertificate || null,
        body.insuranceCertificate || null,
        body.membershipPlan,
        body.agreeToTerms,
        body.agreeToVerification,
        false, // email_verified
        verificationToken,
        verificationTokenExpires,
        'pending_verification' // status
      ]
    );

    const newUser = userResult.rows[0];
    console.log('✅ Database insertion successful. New user ID:', newUser.id);

    // Send verification email
    step = 'sending verification email';
    console.log('🔵 STEP: Sending verification email...');
    
    try {
      await sendVerificationEmail(
        newUser.email, 
        newUser.owner_name, 
        verificationToken
      );
      console.log('✅ Verification email sent successfully');
    } catch (emailError: any) {
      console.error('❌ Email sending failed:', emailError);
      // Continue even if email fails
    }

    // Success response
    console.log('🎉 Seller registration completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Seller application submitted successfully.',
      data: {
        applicationId: `PF-S${newUser.id.toString().padStart(6, '0')}`,
        businessName: newUser.business_name,
        email: newUser.email,
        membershipPlan: newUser.membership_plan,
        status: newUser.status,
        nextSteps: 'Please check your email to verify your account. Our team will review your application within 2-3 business days.'
      }
    });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in seller registration:');
    console.error('Error step:', step);
    console.error('Error message:', error.message);
    
    // Specific error handling
    if (error.message.includes('unique constraint')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email or business name already exists in our system.',
          step: step
        },
        { status: 400 }
      );
    }
    
    if (error.message.includes('null value in column')) {
      const columnMatch = error.message.match(/null value in column "([^"]+)"/);
      const columnName = columnMatch ? columnMatch[1] : 'unknown';
      return NextResponse.json(
        { 
          success: false, 
          error: `Required field '${columnName}' is missing.`,
          step: step
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Registration failed. Please try again or contact support.',
        step: step,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Verification Email Function (same as before)
async function sendVerificationEmail(userEmail: string, userName: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(userEmail)}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 30px; color: #374151; }
    .verification-box { background: #f0f9ff; border: 2px dashed #7c3aed; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .button { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify Your Email Address</h1>
      <p>Complete your PartsFinda seller registration</p>
    </div>
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Thank you for registering as a seller on PartsFinda! To complete your registration, please verify your email address by clicking the button below:</p>
      <div class="verification-box">
        <p><strong>Action Required:</strong> Verify your email within 24 hours</p>
        <a href="${verificationUrl}" class="button">✅ Verify Email Address</a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">
        If the button doesn't work, copy and paste this link in your browser:<br>
        <a href="${verificationUrl}">${verificationUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>This verification link will expire in 24 hours.</p>
      <p>© 2025 PartsFinda Inc. | Auto Parts Marketplace</p>
    </div>
  </div>
</body>
</html>`;

  await sendMail({
    to: userEmail,
    subject: 'Verify Your Email - PartsFinda Seller Registration',
    html: emailHtml,
  });
}