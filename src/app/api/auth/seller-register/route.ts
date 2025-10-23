import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid'; // ✅ Yeh import add karein
import { sendMail } from '@/lib/mailService'; // ✅ Yeh import add karein

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
  businessLicense?: string; // File URL
  taxCertificate?: string;  // File URL
  insuranceCertificate?: string; // File URL
  membershipPlan: string;
  agreeToTerms: boolean;
  agreeToVerification: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SellerRegistrationData = await request.json();
    
    console.log('📝 Seller registration request received');
    console.log('Received data:', {
      email: body.email,
      businessName: body.businessName,
      ownerName: body.ownerName,
      businessLicense: body.businessLicense ? 'File URL provided' : 'No file',
      taxCertificate: body.taxCertificate ? 'File URL provided' : 'No file',
      insuranceCertificate: body.insuranceCertificate ? 'File URL provided' : 'No file'
    });

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
      'SELECT id FROM users WHERE business_name = $1',
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

    // Convert yearsInBusiness to integer
    const yearsInBusinessMap: { [key: string]: number } = {
      '0-1': 1,
      '1-3': 2,
      '3-5': 4,
      '5-10': 7,
      '10+': 10
    };
    const verificationToken = uuidv4() + Date.now();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const yearsInBusinessInt = yearsInBusinessMap[body.yearsInBusiness] || 1;

    try {
      // Use actual file URLs from file upload
      const businessLicenseValue = body.businessLicense || null;
      const taxCertificateValue = body.taxCertificate || null;
      const insuranceCertificateValue = body.insuranceCertificate || null;

      // Create user account with seller role and all business details
      const userResult = await query(
        `INSERT INTO users (
          email, password, name, phone, role, owner_name, business_name, 
          business_type, business_registration_number, tax_id, years_in_business,
          address, parish, city, postal_code, business_phone, business_email,
          website, specializations, vehicle_brands, part_categories,
          business_license, tax_certificate, insurance_certificate,
          membership_plan, agree_to_terms, agree_to_verification, email_verified,  verification_token, verification_token_expires, verified_status 
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        RETURNING id, business_name, email, membership_plan`,
        [
          body.email,                    // $1 - email
          hashedPassword,                // $2 - password
          body.ownerName,                // $3 - name (required field)
          body.phone,                    // $4 - phone
          'seller',                      // $5 - role (set to 'seller')
          body.ownerName,                // $6 - owner_name
          body.businessName,             // $7 - business_name
          body.businessType,             // $8 - business_type
          body.businessRegistrationNumber || null, // $9 - business_registration_number
          body.taxId || null,            // $10 - tax_id
          yearsInBusinessInt,            // $11 - years_in_business
          body.address,                  // $12 - address
          body.parish,                   // $13 - parish
          body.city,                     // $14 - city
          body.postalCode || null,       // $15 - postal_code
          body.businessPhone,            // $16 - business_phone
          body.businessEmail || null,    // $17 - business_email
          body.website || null,          // $18 - website
          body.specializations || [],    // $19 - specializations
          body.vehicleBrands || [],      // $20 - vehicle_brands
          body.partCategories || [],     // $21 - part_categories
          businessLicenseValue,          // $22 - business_license (ACTUAL FILE URL)
          taxCertificateValue,           // $23 - tax_certificate (ACTUAL FILE URL)
          insuranceCertificateValue,     // $24 - insurance_certificate (ACTUAL FILE URL)
          body.membershipPlan,           // $25 - membership_plan
          body.agreeToTerms,             // $26 - agree_to_terms
          body.agreeToVerification,      // $27 - agree_to_verification
          false,                          // $28 - email_verified
          verificationToken,             // $29 - verification_token ✅ NAYA
          verificationTokenExpires,      // $30 - verification_token_expires ✅ NAYA  
         'pending'                      // $31 - status ✅ NAYA
        ]
      );

      const newUser = userResult.rows[0];

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
  // Email failure shouldn't break registration
}


      console.log('✅ Seller registration completed successfully');
      console.log('New user ID:', newUser.id);
      console.log('File URLs saved:', {
        businessLicense: businessLicenseValue,
        taxCertificate: taxCertificateValue,
        insuranceCertificate: insuranceCertificateValue
      });

      return NextResponse.json({
        success: true,
        message: 'Seller application submitted successfully.',
    data: {
    applicationId: `PF-S${newUser.id.toString().padStart(6, '0')}`,
    businessName: newUser.business_name,
    email: newUser.email,
    membershipPlan: newUser.membership_plan,
    status: 'pending_verification', // ✅ Yeh update karein
    nextSteps: 'Please check your email to verify your account. Our team will review your application within 2-3 business days.' // ✅ Message update karein
  }
      });

    } catch (error: any) {
      console.error('❌ Database insertion error:', error);
      
      // More specific error messages
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'Email or business name already exists' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('null value in column "name"')) {
        return NextResponse.json(
          { success: false, error: 'Name field is required' },
          { status: 400 }
        );
      }
      
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
// ✅ YEH FUNCTIONS CODE KE END MEIN ADD KAREIN
function generateVerificationToken() {
  return uuidv4() + Date.now();
}

async function sendVerificationEmail(userEmail: string, userName: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(userEmail)}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: #f3f4f6;
      margin: 0;
      padding: 40px 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 10px; 
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: 700;
    }
    .content { 
      padding: 30px; 
      color: #374151;
    }
    .verification-box { 
      background: #f0f9ff; 
      border: 2px dashed #7c3aed;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .button { 
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 6px; 
      display: inline-block; 
      margin: 15px 0; 
      font-weight: 600;
    }
    .footer { 
      text-align: center; 
      color: #6b7280; 
      font-size: 12px; 
      margin-top: 20px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
    }
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

  try {
    await sendMail({
      to: userEmail,
      subject: 'Verify Your Email - PartsFinda Seller Registration',
      html: emailHtml,
    });
    console.log(`✅ Verification email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}