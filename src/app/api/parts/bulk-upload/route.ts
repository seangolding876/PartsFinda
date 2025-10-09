import { NextRequest, NextResponse } from 'next/server';

interface PartData {
  name: string;
  partNumber?: string;
  price: number;
  stock: number;
  condition: 'new' | 'used' | 'refurbished';
  make?: string;
  model?: string;
  year?: string;
  description?: string;
  category?: string;
  warranty?: string;
  shipping?: string;
  location?: string;
}

// Parse CSV content
function parseCSV(content: string): PartData[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have headers and at least one data row');
  }

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const parts: PartData[] = [];

  // Map CSV headers to our data structure
  const headerMap: Record<string, string> = {
    'part name': 'name',
    'name': 'name',
    'part number': 'partNumber',
    'part_number': 'partNumber',
    'partnumber': 'partNumber',
    'price': 'price',
    'stock': 'stock',
    'quantity': 'stock',
    'condition': 'condition',
    'make': 'make',
    'model': 'model',
    'year': 'year',
    'description': 'description',
    'category': 'category',
    'warranty': 'warranty',
    'shipping': 'shipping',
    'location': 'location'
  };

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const part: any = {};

    headers.forEach((header, index) => {
      const mappedKey = headerMap[header];
      if (mappedKey && values[index]) {
        let value: any = values[index];

        // Type conversions
        if (mappedKey === 'price' || mappedKey === 'stock') {
          value = parseFloat(value.replace(/[^0-9.]/g, ''));
        } else if (mappedKey === 'condition') {
          value = value.toLowerCase();
          if (!['new', 'used', 'refurbished'].includes(value)) {
            value = 'used';
          }
        }

        part[mappedKey] = value;
      }
    });

    // Validate required fields
    if (part.name && part.price && part.stock !== undefined) {
      parts.push(part as PartData);
    }
  }

  return parts;
}

// Validate part data
function validatePart(part: PartData): string[] {
  const errors: string[] = [];

  if (!part.name || part.name.length < 3) {
    errors.push('Part name must be at least 3 characters');
  }

  if (part.price <= 0) {
    errors.push('Price must be greater than 0');
  }

  if (part.stock < 0) {
    errors.push('Stock cannot be negative');
  }

  if (!['new', 'used', 'refurbished'].includes(part.condition)) {
    errors.push('Condition must be new, used, or refurbished');
  }

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sellerEmail = formData.get('sellerEmail') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!sellerEmail) {
      return NextResponse.json(
        { error: 'Seller email is required' },
        { status: 400 }
      );
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Only CSV and Excel files are supported' },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Parse based on file type
    let parts: PartData[] = [];

    if (fileName.endsWith('.csv')) {
      try {
        parts = parseCSV(content);
      } catch (error: any) {
        return NextResponse.json(
          { error: `CSV parsing error: ${error.message}` },
          { status: 400 }
        );
      }
    } else {
      // For Excel files, we would need a library like xlsx
      // For now, return a message about Excel support
      return NextResponse.json(
        {
          error: 'Excel file processing requires additional setup. Please use CSV format for now.',
          csvTemplate: 'Name,Part Number,Price,Stock,Condition,Make,Model,Year,Description'
        },
        { status: 400 }
      );
    }

    // Validate all parts
    const validParts: PartData[] = [];
    const invalidParts: { row: number; part: PartData; errors: string[] }[] = [];

    parts.forEach((part, index) => {
      const errors = validatePart(part);
      if (errors.length === 0) {
        validParts.push(part);
      } else {
        invalidParts.push({
          row: index + 2, // +2 because of header row and 0-based index
          part,
          errors
        });
      }
    });

    // Simulate saving to database
    // In production, this would save to your database
    const savedParts = validParts.map((part, index) => ({
      id: `part_${Date.now()}_${index}`,
      ...part,
      seller: sellerEmail,
      createdAt: new Date().toISOString(),
      status: 'active'
    }));

    console.log(`Bulk upload: ${savedParts.length} parts saved for seller ${sellerEmail}`);

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: parts.length,
        successfulImports: validParts.length,
        failedImports: invalidParts.length
      },
      savedParts: savedParts.slice(0, 5), // Return first 5 as preview
      invalidParts: invalidParts.slice(0, 10), // Return first 10 errors
      message: `Successfully imported ${validParts.length} parts`
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
}

// Generate CSV template
export async function GET(request: NextRequest) {
  const csvTemplate = `Name,Part Number,Price,Stock,Condition,Make,Model,Year,Description,Category,Warranty,Shipping,Location
Brake Pads Ceramic,BP-12345,8999,15,new,Toyota,Camry,2020,High-performance ceramic brake pads,Brakes,6 months,Island-wide,Kingston
Oil Filter Premium,OF-54321,1299,50,new,Honda,Civic,2019,OEM quality oil filter,Filters,3 months,Pickup only,Montego Bay
Alternator Remanufactured,ALT-98765,18999,8,refurbished,Nissan,Altima,2018,Factory remanufactured with warranty,Electrical,1 year,Island-wide,Spanish Town`;

  return new NextResponse(csvTemplate, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="partsfinda_bulk_upload_template.csv"'
    }
  });
}
