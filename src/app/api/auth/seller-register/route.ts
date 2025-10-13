import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

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
  businessLicense?: any;
  taxCertificate?: any;
  insuranceCertificate?: any;
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
      specializations: body.specializations?.length,
      vehicleBrands: body.vehicleBrands?.length
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
    
    const yearsInBusinessInt = yearsInBusinessMap[body.yearsInBusiness] || 1;

    try {
      // Handle file fields - convert to string or null
      const businessLicenseValue = body.businessLicense ? 
        (typeof body.businessLicense === 'string' ? body.businessLicense : 'uploaded') : null;
      
      const taxCertificateValue = body.taxCertificate ? 
        (typeof body.taxCertificate === 'string' ? body.taxCertificate : 'uploaded') : null;
      
      const insuranceCertificateValue = body.insuranceCertificate ? 
        (typeof body.insuranceCertificate === 'string' ? body.insuranceCertificate : 'uploaded') : null;

      // Create user account with seller role and all business details
      const userResult = await query(
        `INSERT INTO users (
          email, password, name, phone, role, owner_name, business_name, 
          business_type, business_registration_number, tax_id, years_in_business,
          address, parish, city, postal_code, business_phone, business_email,
          website, specializations, vehicle_brands, part_categories,
          business_license, tax_certificate, insurance_certificate,
          membership_plan, agree_to_terms, agree_to_verification, email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        RETURNING id, business_name, email, membership_plan`,
        [
          body.email,
          hashedPassword,
          body.ownerName,
          body.phone,
          'seller',
          body.ownerName,
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
          businessLicenseValue,
          taxCertificateValue,
          insuranceCertificateValue,
          body.membershipPlan,
          body.agreeToTerms,
          body.agreeToVerification,
          false
        ]
      );

      const newUser = userResult.rows[0];

      console.log('✅ Seller registration completed successfully');
      console.log('New user ID:', newUser.id);

      return NextResponse.json({
        success: true,
        message: 'Seller application submitted successfully.',
        data: {
          applicationId: `PF-S${newUser.id.toString().padStart(6, '0')}`,
          businessName: newUser.business_name,
          email: newUser.email,
          membershipPlan: newUser.membership_plan,
          status: 'pending_review',
          nextSteps: 'Our team will review your application within 2-3 business days.'
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