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
}

function validateVIN(vin: string): boolean {
  if (!vin || vin.length !== 17) return false;
  
  const invalidChars = ['I', 'O', 'Q'];
  for (const char of invalidChars) {
    if (vin.includes(char)) return false;
  }
  
  return true;
}

async function fetchNHTSAData(vin: string): Promise<VehicleInfo | null> {
  try {
    console.log('Fetching data for VIN:', vin);
    
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      {
        headers: {
          'User-Agent': 'PartsFinda/1.0'
        },
        // timeout handle karna
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!response.ok) {
      console.error('API response not OK:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('NHTSA API Response:', data);

    if (data.Results && data.Results[0]) {
      const result = data.Results[0];
      
      // Check if valid data mila
      if (result.Make && result.Model && result.ModelYear) {
        const vehicleInfo: VehicleInfo = {
          vin: vin,
          make: result.Make,
          model: result.Model,
          year: parseInt(result.ModelYear) || 2020,
          trim: result.Trim || result.Series || '',
          engine: result.EngineConfiguration || 
                 (result.EngineCylinders ? `${result.EngineCylinders} Cylinder` : 'Not Available'),
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
        
        console.log('Processed Vehicle Info:', vehicleInfo);
        return vehicleInfo;
      }
    }
    
    console.log('No valid vehicle data found in response');
    return null;
    
  } catch (error: any) {
    console.error('NHTSA API fetch error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vin = searchParams.get('vin')?.toUpperCase().trim();

    console.log('Received VIN request:', vin);

    if (!vin) {
      return NextResponse.json(
        { success: false, error: 'VIN parameter is required' },
        { status: 400 }
      );
    }

    if (!validateVIN(vin)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.' 
        },
        { status: 400 }
      );
    }

    // NHTSA API se data fetch karo
    const vehicleInfo = await fetchNHTSAData(vin);

    if (!vehicleInfo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vehicle not found in NHTSA database. Please check the VIN and try again.' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicleInfo,
      source: 'nhtsa_api'
    });

  } catch (error: any) {
    console.error('VIN decode error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'VIN decoder temporarily unavailable. Please try again later.' 
      },
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
        { success: false, error: 'VIN is required in request body' },
        { status: 400 }
      );
    }

    const vinUpper = vin.toUpperCase().trim();

    if (!validateVIN(vinUpper)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.' 
        },
        { status: 400 }
      );
    }

    // NHTSA API se data fetch karo
    const vehicleInfo = await fetchNHTSAData(vinUpper);

    if (!vehicleInfo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vehicle not found in NHTSA database. Please check the VIN and try again.' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicleInfo,
      source: 'nhtsa_api'
    });

  } catch (error: any) {
    console.error('VIN decode error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during VIN decoding' 
      },
      { status: 500 }
    );
  }
}