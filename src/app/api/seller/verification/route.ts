import { NextRequest, NextResponse } from 'next/server';

interface VerificationRequest {
  sellerEmail: string;
  businessName: string;
  businessType: 'individual' | 'company' | 'partnership';
  taxRegistrationNumber?: string; // TRN
  businessRegistrationNumber?: string; // BRN
  phoneNumber: string;
  businessAddress: string;
  parish: string;
  documents: {
    type: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
  }[];
  websiteUrl?: string;
  yearsInBusiness: number;
}

interface VerificationStatus {
  id: string;
  sellerEmail: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  verifiedAt?: string;
  expiresAt?: string;
  verificationLevel: 'basic' | 'standard' | 'premium';
  badge: {
    type: 'verified' | 'trusted' | 'premium';
    color: string;
    icon: string;
  };
  documents: any[];
  notes?: string;
}

// Document validation
function validateDocument(file: File): string | null {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    return 'Invalid document type. Please upload PDF, JPG, PNG, or DOC files.';
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'Document size must be less than 5MB';
  }

  return null;
}

// Submit verification request
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const sellerEmail = formData.get('sellerEmail') as string;
    const businessName = formData.get('businessName') as string;
    const businessType = formData.get('businessType') as string;
    const taxRegistrationNumber = formData.get('taxRegistrationNumber') as string;
    const businessRegistrationNumber = formData.get('businessRegistrationNumber') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const businessAddress = formData.get('businessAddress') as string;
    const parish = formData.get('parish') as string;
    const websiteUrl = formData.get('websiteUrl') as string;
    const yearsInBusiness = parseInt(formData.get('yearsInBusiness') as string || '0');

    // Validate required fields
    if (!sellerEmail || !businessName || !businessType || !phoneNumber || !businessAddress || !parish) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process uploaded documents
    const documents: any[] = [];
    const documentErrors: string[] = [];

    // Get all files from formData
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('document_') && value instanceof File) {
        const error = validateDocument(value);
        if (error) {
          documentErrors.push(`${value.name}: ${error}`);
        } else {
          // In production, upload to cloud storage (S3, etc.)
          documents.push({
            type: key.replace('document_', ''),
            fileName: value.name,
            fileSize: value.size,
            uploadedAt: new Date().toISOString(),
            // In production, store the URL from cloud storage
            url: `/uploads/verification/${sellerEmail}/${value.name}`
          });
        }
      }
    }

    if (documentErrors.length > 0) {
      return NextResponse.json(
        { error: 'Document validation failed', errors: documentErrors },
        { status: 400 }
      );
    }

    // Determine verification level based on provided information
    let verificationLevel: 'basic' | 'standard' | 'premium' = 'basic';
    let badge: {
      type: 'verified' | 'trusted' | 'premium';
      color: string;
      icon: string;
    } = {
      type: 'verified',
      color: 'blue',
      icon: 'check'
    };

    if (taxRegistrationNumber && businessRegistrationNumber && documents.length >= 2) {
      verificationLevel = 'premium';
      badge = {
        type: 'premium',
        color: 'gold',
        icon: 'star'
      };
    } else if ((taxRegistrationNumber || businessRegistrationNumber) && documents.length >= 1) {
      verificationLevel = 'standard';
      badge = {
        type: 'trusted',
        color: 'green',
        icon: 'shield'
      };
    }

    // Create verification request
    const verificationRequest: VerificationRequest = {
      sellerEmail,
      businessName,
      businessType: businessType as 'individual' | 'company' | 'partnership',
      taxRegistrationNumber,
      businessRegistrationNumber,
      phoneNumber,
      businessAddress,
      parish,
      documents,
      websiteUrl,
      yearsInBusiness
    };

    // Simulate auto-approval for demo (in production, this would go to admin review)
    const autoApprove = documents.length > 0 && (taxRegistrationNumber || businessRegistrationNumber);

    const verificationStatus: VerificationStatus = {
      id: `VER_${Date.now()}`,
      sellerEmail,
      status: autoApprove ? 'approved' : 'pending',
      verifiedAt: autoApprove ? new Date().toISOString() : undefined,
      expiresAt: autoApprove ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      verificationLevel,
      badge,
      documents,
      notes: autoApprove ? 'Auto-approved based on document verification' : 'Pending manual review'
    };

    // Log verification request (in production, save to database)
    console.log('Verification request:', verificationRequest);
    console.log('Verification status:', verificationStatus);

    return NextResponse.json({
      success: true,
      verificationId: verificationStatus.id,
      status: verificationStatus.status,
      verificationLevel,
      badge,
      message: autoApprove
        ? 'Verification approved! Your verified badge is now active.'
        : 'Verification request submitted. We will review your documents within 24-48 hours.',
      estimatedReviewTime: autoApprove ? null : '24-48 hours'
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to process verification request' },
      { status: 500 }
    );
  }
}

// Get verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerEmail = searchParams.get('sellerEmail');

    if (!sellerEmail) {
      return NextResponse.json(
        { error: 'Seller email is required' },
        { status: 400 }
      );
    }

    // Simulate fetching verification status from database
    // Check if seller has submitted verification
    const hasVerification = Math.random() > 0.3; // 70% chance of having verification

    if (!hasVerification) {
      return NextResponse.json({
        success: true,
        verified: false,
        status: null,
        message: 'No verification found for this seller'
      });
    }

    // Return mock verification status
    const verificationStatus: VerificationStatus = {
      id: `VER_${Date.now()}`,
      sellerEmail,
      status: 'approved',
      verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      expiresAt: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(), // 335 days from now
      verificationLevel: 'standard',
      badge: {
        type: 'trusted',
        color: 'green',
        icon: 'shield'
      },
      documents: [
        {
          type: 'trn',
          fileName: 'trn_document.pdf',
          uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    return NextResponse.json({
      success: true,
      verified: true,
      status: verificationStatus,
      daysUntilExpiry: 335
    });

  } catch (error) {
    console.error('Get verification error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
}

// Update verification (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationId, status, notes, adminEmail } = body;

    // In production, verify admin authentication
    if (!adminEmail || !adminEmail.includes('@partsfinda.com')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    if (!verificationId || !status) {
      return NextResponse.json(
        { error: 'Verification ID and status are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update verification status in database
    console.log('Verification updated:', {
      verificationId,
      status,
      notes,
      updatedBy: adminEmail,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Verification ${status}`,
      verificationId,
      status
    });

  } catch (error) {
    console.error('Update verification error:', error);
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    );
  }
}
