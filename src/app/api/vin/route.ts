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

// Mock VIN database with realistic vehicle data
const mockVinDatabase: Record<string, VehicleInfo> = {
  // Toyota Camry 2020
  '4T1G11AK0LU123456': {
    vin: '4T1G11AK0LU123456',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    trim: 'LE',
    engine: '2.5L 4-Cylinder',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'Sedan',
    fuel: 'Gasoline',
    country: 'United States',
    manufacturer: 'Toyota Motor Manufacturing',
    plantCity: 'Georgetown',
    plantState: 'Kentucky',
    plantCountry: 'USA',
    series: 'XV70',
    vehicleType: 'Passenger Car',
    engineSize: '2.5L',
    doors: 4,
    displacementCC: 2487,
    displacementL: 2.5,
    cylinders: 4,
    fuelInjection: 'Port Injection',
    compressionRatio: '13.0:1'
  },

  // Honda Accord 2019
  '1HGCV1F3XKA123456': {
    vin: '1HGCV1F3XKA123456',
    make: 'Honda',
    model: 'Accord',
    year: 2019,
    trim: 'LX',
    engine: '1.5L Turbo 4-Cylinder',
    transmission: 'CVT',
    drivetrain: 'FWD',
    bodyStyle: 'Sedan',
    fuel: 'Gasoline',
    country: 'United States',
    manufacturer: 'Honda Manufacturing',
    plantCity: 'Marysville',
    plantState: 'Ohio',
    plantCountry: 'USA',
    series: '10th Generation',
    vehicleType: 'Passenger Car',
    engineSize: '1.5L Turbo',
    doors: 4,
    displacementCC: 1498,
    displacementL: 1.5,
    cylinders: 4,
    fuelInjection: 'Direct Injection',
    compressionRatio: '10.6:1'
  },

  // Ford F-150 2021
  '1FTEW1E5XMFB12345': {
    vin: '1FTEW1E5XMFb12345',
    make: 'Ford',
    model: 'F-150',
    year: 2021,
    trim: 'XLT',
    engine: '3.5L V6 EcoBoost',
    transmission: '10-Speed Automatic',
    drivetrain: '4WD',
    bodyStyle: 'SuperCrew Cab',
    fuel: 'Gasoline',
    country: 'United States',
    manufacturer: 'Ford Motor Company',
    plantCity: 'Dearborn',
    plantState: 'Michigan',
    plantCountry: 'USA',
    series: '14th Generation',
    vehicleType: 'Truck',
    engineSize: '3.5L Twin Turbo',
    doors: 4,
    displacementCC: 3496,
    displacementL: 3.5,
    cylinders: 6,
    fuelInjection: 'Direct Injection',
    compressionRatio: '10.5:1'
  },

  // BMW 3 Series 2018
  'WBA8E1C59JA123456': {
    vin: 'WBA8E1C59JA123456',
    make: 'BMW',
    model: '3 Series',
    year: 2018,
    trim: '330i',
    engine: '2.0L Turbo 4-Cylinder',
    transmission: '8-Speed Automatic',
    drivetrain: 'RWD',
    bodyStyle: 'Sedan',
    fuel: 'Gasoline',
    country: 'Germany',
    manufacturer: 'BMW Group',
    plantCity: 'Munich',
    plantCountry: 'Germany',
    series: 'F30',
    vehicleType: 'Passenger Car',
    engineSize: '2.0L Turbo',
    doors: 4,
    displacementCC: 1998,
    displacementL: 2.0,
    cylinders: 4,
    fuelInjection: 'Direct Injection',
    compressionRatio: '11.0:1'
  },

  // Chevrolet Silverado 2020
  '1GCUYDE10LF123456': {
    vin: '1GCUYDE10LF123456',
    make: 'Chevrolet',
    model: 'Silverado 1500',
    year: 2020,
    trim: 'LT',
    engine: '5.3L V8',
    transmission: '8-Speed Automatic',
    drivetrain: '4WD',
    bodyStyle: 'Double Cab',
    fuel: 'Gasoline',
    country: 'United States',
    manufacturer: 'General Motors',
    plantCity: 'Fort Wayne',
    plantState: 'Indiana',
    plantCountry: 'USA',
    series: 'T1XX',
    vehicleType: 'Truck',
    engineSize: '5.3L V8',
    doors: 4,
    displacementCC: 5328,
    displacementL: 5.3,
    cylinders: 8,
    fuelInjection: 'Direct Injection',
    compressionRatio: '11.0:1'
  }
};

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

function generateRandomVehicleInfo(vin: string): VehicleInfo {
  const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan', 'Hyundai', 'Kia'];
  const models = ['Camry', 'Accord', 'F-150', 'Silverado', 'Civic', 'Corolla', 'Escape', 'CR-V', 'Pilot', 'Tahoe'];
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const engines = ['2.0L 4-Cylinder', '2.5L 4-Cylinder', '3.5L V6', '5.0L V8', '1.5L Turbo', '2.0L Turbo'];
  const transmissions = ['Automatic', 'Manual', 'CVT', '8-Speed Automatic', '10-Speed Automatic'];
  const drivetrains = ['FWD', 'RWD', 'AWD', '4WD'];
  const bodyStyles = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Wagon'];

  const randomMake = makes[Math.floor(Math.random() * makes.length)];
  const randomModel = models[Math.floor(Math.random() * models.length)];
  const randomYear = years[Math.floor(Math.random() * years.length)];

  return {
    vin,
    make: randomMake,
    model: randomModel,
    year: randomYear,
    engine: engines[Math.floor(Math.random() * engines.length)],
    transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
    drivetrain: drivetrains[Math.floor(Math.random() * drivetrains.length)],
    bodyStyle: bodyStyles[Math.floor(Math.random() * bodyStyles.length)],
    fuel: 'Gasoline',
    country: 'United States',
    manufacturer: `${randomMake} Manufacturing`,
    vehicleType: 'Passenger Car',
    doors: Math.random() > 0.5 ? 4 : 2,
    cylinders: Math.random() > 0.7 ? 6 : 4
  };
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

    // Check if VIN exists in our mock database
    let vehicleInfo = mockVinDatabase[vin];

    if (!vehicleInfo) {
      // Generate random but realistic data for unknown VINs
      vehicleInfo = generateRandomVehicleInfo(vin);
    }

    return NextResponse.json({
      success: true,
      data: vehicleInfo
    });

  } catch (error) {
    console.error('VIN decode error:', error);
    return NextResponse.json(
      { error: 'Internal server error during VIN decoding' },
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

    // Check if VIN exists in our mock database
    let vehicleInfo = mockVinDatabase[vinUpper];

    if (!vehicleInfo) {
      // Generate random but realistic data for unknown VINs
      vehicleInfo = generateRandomVehicleInfo(vinUpper);
    }

    return NextResponse.json({
      success: true,
      data: vehicleInfo
    });

  } catch (error) {
    console.error('VIN decode error:', error);
    return NextResponse.json(
      { error: 'Internal server error during VIN decoding' },
      { status: 500 }
    );
  }
}
