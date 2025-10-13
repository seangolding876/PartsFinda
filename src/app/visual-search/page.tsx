'use client';

import { useState } from 'react';

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

export default function VINDecoder() {
  const [vin, setVin] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const decodeVIN = async () => {
    if (!vin || vin.length !== 17) {
      setError('Please enter a valid 17-character VIN');
      return;
    }

    setLoading(true);
    setError('');
    setVehicleInfo(null);

    try {
      const response = await fetch(`/api/vin?vin=${vin.toUpperCase()}`);
      const data = await response.json();

      if (data.success) {
        setVehicleInfo(data.data);
      } else {
        setError(data.error || 'Failed to decode VIN');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            VIN Decoder
          </h1>
          <p className="text-lg text-gray-600">
            Enter your Vehicle Identification Number to get detailed vehicle information
          </p>
        </div>

        {/* VIN Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="Enter 17-character VIN (e.g., 4T1G11AK0LU123456)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={17}
            />
            <button
              onClick={decodeVIN}
              disabled={loading || vin.length !== 17}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Decoding...' : 'Decode VIN'}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Vehicle Information Display */}
        {vehicleInfo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Vehicle Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Basic Information
                </h3>
                <InfoRow label="VIN" value={vehicleInfo.vin} />
                <InfoRow label="Make" value={vehicleInfo.make} />
                <InfoRow label="Model" value={vehicleInfo.model} />
                <InfoRow label="Year" value={vehicleInfo.year.toString()} />
                <InfoRow label="Trim" value={vehicleInfo.trim} />
                <InfoRow label="Body Style" value={vehicleInfo.bodyStyle} />
                <InfoRow label="Vehicle Type" value={vehicleInfo.vehicleType} />
              </div>

              {/* Technical Specifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Technical Specifications
                </h3>
                <InfoRow label="Engine" value={vehicleInfo.engine} />
                <InfoRow label="Engine Size" value={vehicleInfo.engineSize} />
                <InfoRow label="Transmission" value={vehicleInfo.transmission} />
                <InfoRow label="Drivetrain" value={vehicleInfo.drivetrain} />
                <InfoRow label="Fuel Type" value={vehicleInfo.fuel} />
                <InfoRow label="Cylinders" value={vehicleInfo.cylinders?.toString()} />
                <InfoRow label="Doors" value={vehicleInfo.doors?.toString()} />
              </div>

              {/* Manufacturing Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Manufacturing
                </h3>
                <InfoRow label="Manufacturer" value={vehicleInfo.manufacturer} />
                <InfoRow label="Country" value={vehicleInfo.country} />
                <InfoRow label="Plant City" value={vehicleInfo.plantCity} />
                <InfoRow label="Plant State" value={vehicleInfo.plantState} />
                <InfoRow label="Plant Country" value={vehicleInfo.plantCountry} />
                <InfoRow label="Series" value={vehicleInfo.series} />
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Additional Details
                </h3>
                <InfoRow label="Fuel Injection" value={vehicleInfo.fuelInjection} />
                <InfoRow label="Compression Ratio" value={vehicleInfo.compressionRatio} />
                <InfoRow label="Displacement (L)" value={vehicleInfo.displacementL?.toString()} />
                <InfoRow label="Displacement (CC)" value={vehicleInfo.displacementCC?.toString()} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for displaying information rows
function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="font-medium text-gray-700">{label}:</span>
      <span className="text-gray-900">{value || 'N/A'}</span>
    </div>
  );
}