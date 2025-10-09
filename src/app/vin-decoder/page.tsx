'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Search, AlertCircle, CheckCircle, Package, Wrench } from 'lucide-react';

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
  manufacturer: string;
  doors?: number;
  cylinders?: number;
}

export default function VINDecoderPage() {
  const router = useRouter();
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [showSampleVins, setShowSampleVins] = useState(false);

  const sampleVins = [
    { vin: '4T1G11AK0LU123456', description: '2020 Toyota Camry LE' },
    { vin: '1HGCV1F3XKA123456', description: '2019 Honda Accord LX' },
    { vin: '1FTEW1E5XMFB12345', description: '2021 Ford F-150 XLT' },
    { vin: 'WBA8E1C59JA123456', description: '2018 BMW 3 Series 330i' },
    { vin: '1GCUYDE10LF123456', description: '2020 Chevrolet Silverado LT' }
  ];

  const recommendedParts = [
    { category: 'Maintenance', parts: ['Oil Filter', 'Air Filter', 'Spark Plugs', 'Brake Pads'] },
    { category: 'Fluids', parts: ['Engine Oil', 'Coolant', 'Brake Fluid', 'Transmission Fluid'] },
    { category: 'Wear Items', parts: ['Wiper Blades', 'Battery', 'Tires', 'Belts'] },
    { category: 'Common Repairs', parts: ['Alternator', 'Starter', 'Water Pump', 'Thermostat'] }
  ];

  const validateVIN = (vinInput: string): boolean => {
    if (vinInput.length !== 17) return false;

    // VIN cannot contain I, O, or Q
    const invalidChars = /[IOQ]/i;
    if (invalidChars.test(vinInput)) return false;

    return true;
  };

  const handleDecode = async () => {
    if (!vin) {
      setError('Please enter a VIN');
      return;
    }

    if (!validateVIN(vin)) {
      setError('Invalid VIN format. Must be 17 characters and cannot contain I, O, or Q');
      return;
    }

    setLoading(true);
    setError('');
    setVehicleInfo(null);

    try {
      // First try NHTSA API for US vehicles
      const nhtsaResponse = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
      );
      const nhtsaData = await nhtsaResponse.json();

      if (nhtsaData.Results && nhtsaData.Results[0]) {
        const result = nhtsaData.Results[0];

        if (result.Make && result.Model && result.ModelYear) {
          setVehicleInfo({
            vin: vin.toUpperCase(),
            make: result.Make,
            model: result.Model,
            year: parseInt(result.ModelYear),
            trim: result.Trim || result.Series,
            engine: result.EngineCylinders ? `${result.EngineCylinders} Cylinder ${result.FuelTypePrimary || ''}` : 'Not Available',
            transmission: result.TransmissionStyle || 'Not Available',
            drivetrain: result.DriveType || 'Not Available',
            bodyStyle: result.BodyClass || 'Not Available',
            fuel: result.FuelTypePrimary || 'Gasoline',
            manufacturer: result.Manufacturer || result.Make,
            doors: result.Doors ? parseInt(result.Doors) : undefined,
            cylinders: result.EngineCylinders ? parseInt(result.EngineCylinders) : undefined
          });
        } else {
          // Fallback to local API
          await fetchLocalAPI();
        }
      } else {
        await fetchLocalAPI();
      }
    } catch (error) {
      console.error('Error decoding VIN:', error);
      await fetchLocalAPI();
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalAPI = async () => {
    try {
      const response = await fetch(`/api/vin?vin=${vin}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setVehicleInfo(data.data);
      } else {
        setError('Unable to decode VIN. Please verify and try again.');
      }
    } catch (error) {
      console.error('Local API error:', error);
      setError('VIN decoder service temporarily unavailable. Please try again later.');
    }
  };

  const searchForParts = (partType?: string) => {
    if (vehicleInfo) {
      const params = new URLSearchParams({
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        year: vehicleInfo.year.toString()
      });

      if (partType) {
        params.append('search', partType);
      }

      router.push(`/request-part?${params.toString()}`);
    }
  };

  const handleUseSampleVin = (sampleVin: string) => {
    setVin(sampleVin);
    setError('');
    setVehicleInfo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">VIN Decoder</h1>
          <p className="text-gray-600">
            Enter your Vehicle Identification Number to find compatible parts
          </p>
        </div>

        {/* VIN Input Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Enter 17-Character VIN
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))}
                placeholder="Example: 1HGCV1F3XKA123456"
                maxLength={17}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
              />
              <button
                onClick={handleDecode}
                disabled={loading || vin.length !== 17}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Decoding...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Decode VIN
                  </>
                )}
              </button>
            </div>

            {/* Character Counter */}
            <div className="mt-2 text-sm text-gray-500">
              {vin.length}/17 characters
              {vin.length === 17 && <CheckCircle className="inline w-4 h-4 text-green-500 ml-2" />}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Sample VINs */}
          <div className="mt-4">
            <button
              onClick={() => setShowSampleVins(!showSampleVins)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showSampleVins ? 'Hide' : 'Show'} Sample VINs
            </button>

            {showSampleVins && (
              <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Try these sample VINs:</p>
                <div className="space-y-2">
                  {sampleVins.map((sample) => (
                    <button
                      key={sample.vin}
                      onClick={() => handleUseSampleVin(sample.vin)}
                      className="block w-full text-left p-2 bg-white rounded hover:bg-gray-50 transition"
                    >
                      <span className="font-mono text-sm">{sample.vin}</span>
                      <span className="text-gray-600 text-sm ml-2">- {sample.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Information Display */}
        {vehicleInfo && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Car className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold">
                {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">VIN:</span>
                  <span className="font-mono font-semibold">{vehicleInfo.vin}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-semibold">{vehicleInfo.year}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Make:</span>
                  <span className="font-semibold">{vehicleInfo.make}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-semibold">{vehicleInfo.model}</span>
                </div>
                {vehicleInfo.trim && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Trim:</span>
                    <span className="font-semibold">{vehicleInfo.trim}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Engine:</span>
                  <span className="font-semibold">{vehicleInfo.engine}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Transmission:</span>
                  <span className="font-semibold">{vehicleInfo.transmission}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Drivetrain:</span>
                  <span className="font-semibold">{vehicleInfo.drivetrain}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Body Style:</span>
                  <span className="font-semibold">{vehicleInfo.bodyStyle}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Fuel Type:</span>
                  <span className="font-semibold">{vehicleInfo.fuel}</span>
                </div>
              </div>
            </div>

            {/* Search for Parts Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => searchForParts()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                Find Parts for This Vehicle
              </button>
              <button
                onClick={() => setVehicleInfo(null)}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Decode Another VIN
              </button>
            </div>
          </div>
        )}

        {/* Recommended Parts Section */}
        {vehicleInfo && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-orange-500" />
              Recommended Parts for Your {vehicleInfo.make} {vehicleInfo.model}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {recommendedParts.map((category) => (
                <div key={category.category} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3">{category.category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.parts.map((part) => (
                      <button
                        key={part}
                        onClick={() => searchForParts(part)}
                        className="px-3 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-full text-sm transition"
                      >
                        {part}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Where to Find Your VIN?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Dashboard - Look through the windshield on the driver's side</li>
            <li>• Driver's door jamb - Open the door and check the pillar</li>
            <li>• Vehicle registration document</li>
            <li>• Insurance card or policy</li>
            <li>• Vehicle title document</li>
          </ul>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> VINs never contain the letters I, O, or Q to avoid confusion with numbers 1 and 0.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
