import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('type') as string;
    const sellerEmail = formData.get('sellerEmail') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only PDF, JPG, and PNG files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Create seller-specific folder
    const sellerFolder = sellerEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'sellers', sellerFolder);
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${documentType}_${timestamp}_${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file URL for database
    const fileUrl = `/uploads/sellers/${sellerFolder}/${fileName}`;

    console.log('✅ File uploaded successfully:', {
      originalName: file.name,
      savedPath: fileUrl,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl,
      fileName: file.name
    });

  } catch (error: any) {
    console.error('❌ File upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}