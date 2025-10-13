import { NextRequest, NextResponse } from 'next/server';

interface VehicleInfo {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  bodyStyle: string;
  fuel: string;
  country: string;
  manufacturer: string;
  plantCity?: string;
  plantState?: string;
  plantCountry?: string;
  series?: string;
  vehicleType: string;
  engineSize?: string;
  doors?: number;
  displacementCC?: number;
  displacementL?: number;
  cylinders?: number;
  fuelInjection?: string;
  compressionRatio?: string;
  error?: string;
}

function validateVIN(vin: string): boolean {
  // Basic VIN validation
  if (!vin || vin.length !== 17) return false;

  // Check for invalid characters
  const invalidChars = ['I', 'O', 'Q'];
  for (const char of invalidChars) {
    if (vin.includes(char)) return false;
  }

  return true;
}

async function fetchNHTSAData(vin: string): Promise<VehicleInfo | null> {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      {
        headers: {
          'User-Agent': 'PartsFinda-VIN-Decoder/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.Results && data.Results[0]) {
      const result = data.Results[0];

      // Check if we got valid data
      if (result.Make && result.Model && result.ModelYear) {
        return {
          vin: vin,
          make: result.Make,
          model: result.Model,
          year: parseInt(result.ModelYear),
          trim: result.Trim || result.Series || '',
          engine: result.EngineConfiguration || 
                  (result.EngineCylinders ? `${result.EngineCylinders}-Cylinder` : 'Not Available'),
          transmission: result.TransmissionStyle || 'Automatic',
          drivetrain: result.DriveType || 'FWD',
          bodyStyle: result.BodyClass || 'Sedan',
          fuel: result.FuelTypePrimary || 'Gasoline',
          country: result.PlantCountry || 'United States',
          manufacturer: result.Manufacturer || result.Make,
          plantCity: result.PlantCity,
          plantState: result.PlantState,
          plantCountry: result.PlantCountry,
          series: result.Series,
          vehicleType: result.VehicleType || 'Passenger Car',
          engineSize: result.DisplacementL ? `${result.DisplacementL}L` : 
                     result.DisplacementCC ? `${result.DisplacementCC}cc` : undefined,
          doors: result.Doors ? parseInt(result.Doors) : undefined,
          displacementCC: result.DisplacementCC ? parseInt(result.DisplacementCC) : undefined,
          displacementL: result.DisplacementL ? parseFloat(result.DisplacementL) : undefined,
          cylinders: result.EngineCylinders ? parseInt(result.EngineCylinders) : undefined,
          fuelInjection: result.FuelInjectionType,
          compressionRatio: result.CompressionRatio
        };
      }
    }

    return null;
  } catch (error) {
    console.error('NHTSA API error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vin = searchParams.get('vin')?.toUpperCase();

    if (!vin) {
      return NextResponse.json(
        { error: 'VIN parameter is required' },
        { status: 400 }
      );
    }

    if (!validateVIN(vin)) {
      return NextResponse.json(
        { error: 'Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.' },
        { status: 400 }
      );
    }

    // Fetch live data from NHTSA API
    const vehicleInfo = await fetchNHTSAData(vin);

    if (!vehicleInfo) {
      return NextResponse.json(
        { error: 'Vehicle not found in NHTSA database. Please check the VIN and try again.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicleInfo,
      source: 'nhtsa_api'
    });

  } catch (error) {
    console.error('VIN decode error:', error);
    return NextResponse.json(
      { error: 'VIN decoder temporarily unavailable. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vin } = body;

    if (!vin) {
      return NextResponse.json(
        { error: 'VIN is required in request body' },
        { status: 400 }
      );
    }

    const vinUpper = vin.toUpperCase();

    if (!validateVIN(vinUpper)) {
      return NextResponse.json(
        { error: 'Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.' },
        { status: 400 }
      );
    }

    // Fetch live data from NHTSA API
    const vehicleInfo = await fetchNHTSAData(vinUpper);

    if (!vehicleInfo) {
      return NextResponse.json(
        { error: 'Vehicle not found in NHTSA database. Please check the VIN and try again.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicleInfo,
      source: 'nhtsa_api'
    });

  } catch (error) {
    console.error('VIN decode error:', error);
    return NextResponse.json(
      { error: 'Internal server error during VIN decoding' },
      { status: 500 }
    );
  }
}