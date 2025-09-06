'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, Phone, Check, Truck, Shield, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: ''
  })

  const handleSearch = () => {
    if (vehicleData.make) {
      router.push(`/marketplace?make=${vehicleData.make}&model=${vehicleData.model}&year=${vehicleData.year}`)
    }
  }

  const carMakes = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi', 'Subaru',
    'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen',
    'Hyundai', 'Kia', 'Peugeot', 'Renault', 'Fiat', 'Volvo'
  ]

  const years = Array.from({ length: 30 }, (_, i) => 2024 - i)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <a href="tel:1-876-219-3329" className="text-3xl font-bold text-blue-600 hover:text-blue-700">
                  1-876-219-3329
                </a>
                <p className="text-sm text-gray-600">Call us for parts assistance</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-600">
                <p className="font-medium">Ready to help you find parts!</p>
                <p className="text-sm">
                  <a href="mailto:partsfinda@gmail.com" className="text-blue-600 hover:underline">
                    partsfinda@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with Vehicle Selector */}
      <div
        className="relative bg-gradient-to-br from-gray-50 to-gray-100"
        style={{
          backgroundImage: `url('https://ext.same-assets.com/4217918659/2989056398.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'right center'
        }}
      >
        <div className="absolute inset-0 bg-white/90"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-5xl font-bold mb-4">
                <span className="text-gray-700">Find </span>
                <span className="text-gray-900">Auto Parts</span>
                <br />
                <span className="text-gray-600">From </span>
                <span className="text-green-600">Trusted Sellers</span>
                <span className="text-gray-600"> in Jamaica</span>
              </h1>

              {/* Vehicle Selector Card */}
              <div className="bg-red-50 rounded-lg p-6 mt-8 shadow-lg">
                <p className="text-gray-700 mb-4">Search for parts by vehicle</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-red-800 font-semibold mb-2">MAKE:</label>
                    <select
                      value={vehicleData.make}
                      onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value, model: '' })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Make</option>
                      {carMakes.map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-red-800 font-semibold mb-2">MODEL:</label>
                    <select
                      value={vehicleData.model}
                      onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!vehicleData.make}
                    >
                      <option value="">Select Model</option>
                      {vehicleData.make && (
                        <>
                          <option value="Camry">Camry</option>
                          <option value="Corolla">Corolla</option>
                          <option value="RAV4">RAV4</option>
                          <option value="Highlander">Highlander</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-red-800 font-semibold mb-2">YEAR:</label>
                    <select
                      value={vehicleData.year}
                      onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSearch}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 rounded-md font-semibold text-lg hover:from-blue-700 hover:to-green-700 transition-all"
                  >
                    Search Parts for This Vehicle
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Benefits */}
            <div className="lg:pl-12">
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
                  <div className="flex items-start gap-4">
                    <Clock className="text-blue-600 w-8 h-8 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg mb-1">QUICK</h3>
                      <p className="text-gray-600">Find Quality New & Used Parts Fast!</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
                  <div className="flex items-start gap-4">
                    <Shield className="text-green-600 w-8 h-8 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg mb-1">TRUSTED</h3>
                      <p className="text-gray-600">Verified sellers across Jamaica</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-600">
                  <div className="flex items-start gap-4">
                    <Truck className="text-orange-600 w-8 h-8 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg mb-1">DELIVERY</h3>
                      <p className="text-gray-600">Island-wide delivery available</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Card */}
              <div className="mt-8 bg-gray-900 text-white p-6 rounded-lg">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Can't Find What You Need?</h3>
                  <p className="text-gray-300 mb-4">Let our network of sellers find it for you</p>
                  <Link
                    href="/request-part"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
                  >
                    Request a Part
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose PartsFinda?</h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Verified Sellers</h3>
              <p className="text-gray-600">All sellers are verified for your peace of mind</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Quality Parts</h3>
              <p className="text-gray-600">New and used parts from trusted sources</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Island-wide Delivery</h3>
              <p className="text-gray-600">Get parts delivered anywhere in Jamaica</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Expert Support</h3>
              <p className="text-gray-600">Get help finding the right parts</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-bold text-lg mb-2">Search or Request</h3>
              <p className="text-gray-600">Browse our marketplace or request a specific part</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-bold text-lg mb-2">Get Quotes</h3>
              <p className="text-gray-600">Receive competitive quotes from multiple sellers</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-bold text-lg mb-2">Connect & Buy</h3>
              <p className="text-gray-600">Message sellers directly and arrange purchase</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Jamaica's Auto Parts Marketplace
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Connect with trusted sellers and find the parts you need
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100 transition-colors"
            >
              Browse Parts
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/auth/seller-signup"
              className="inline-flex items-center justify-center px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-md hover:bg-white/10 transition-colors"
            >
              Become a Seller
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
