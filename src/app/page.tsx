'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ChevronRight, Phone, Check, Truck, Shield, Clock, Search, FileText, Camera, MessageSquare, Car, Wrench, Star, MapPin, Mail, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { vehicleMakes, getModelsForMake, getYearRange } from '@/lib/vehicleData'

export default function HomePage() {
  const router = useRouter()
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    partName: '',
    oemNumber: '',
    parish: '',
    notes: ''
  })
  const [availableModels, setAvailableModels] = useState<string[]>([])

  useEffect(() => {
    if (vehicleData.make) {
      const models = getModelsForMake(vehicleData.make)
      setAvailableModels(models)
    } else {
      setAvailableModels([])
    }
  }, [vehicleData.make])

  const handleMakeChange = (make: string) => {
    setVehicleData({ ...vehicleData, make, model: '' })
  }

  const handleRequestPart = () => {
    // Redirect to request part page with pre-filled vehicle data
    const params = new URLSearchParams()
    if (vehicleData.make) params.append('make', vehicleData.make)
    if (vehicleData.model) params.append('model', vehicleData.model)
    if (vehicleData.year) params.append('year', vehicleData.year)
    if (vehicleData.partName) params.append('search', vehicleData.partName)

    router.push(`/request-part?${params.toString()}`)
  }



  const years = getYearRange()
  const jamaicaParishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
    'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
    'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
  ]

  const popularParts = [
    {
      name: 'Brake Pads',
      price: 'J$8,500',
      image: 'https://ext.same-assets.com/394992809/2530530056.webp'
    },
    {
      name: 'Oil Filter',
      price: 'J$2,200',
      image: 'https://ext.same-assets.com/394992809/1815990976.webp'
    },
    {
      name: 'Spark Plugs',
      price: 'J$1,800',
      image: 'https://ext.same-assets.com/394992809/3306996441.webp'
    },
    {
      name: 'Air Filter',
      price: 'J$3,500',
      image: 'https://ext.same-assets.com/394992809/2534202371.webp'
    },
    {
      name: 'Transmission Fluid',
      price: 'J$4,200',
      image: 'https://ext.same-assets.com/394992809/3093145333.webp'
    },
    {
      name: 'Battery',
      price: 'J$12,500',
      image: 'https://ext.same-assets.com/394992809/1439390553.webp'
    },
    {
      name: 'Radiator',
      price: 'J$15,800',
      image: 'https://ext.same-assets.com/394992809/1683520931.webp'
    },
    {
      name: 'Alternator',
      price: 'J$18,500',
      image: 'https://ext.same-assets.com/394992809/2530530056.webp'
    }
  ]

  const suppliers = [
    {
      name: 'Kingston Auto Parts',
      location: 'Kingston',
      rating: 4.8,
      reviews: '50+ reviews',
      image: 'https://ext.same-assets.com/394992809/111244731.webp',
      specialties: ['Engine Parts', 'Brake Systems', 'Electrical']
    },
    {
      name: 'Spanish Town Motors',
      location: 'Spanish Town',
      rating: 4.9,
      reviews: '50+ reviews',
      image: 'https://ext.same-assets.com/394992809/2388574119.webp',
      specialties: ['Transmission', 'Suspension', 'Body Parts']
    },
    {
      name: 'Montego Bay Auto',
      location: 'Montego Bay',
      rating: 4.7,
      reviews: '50+ reviews',
      image: 'https://ext.same-assets.com/394992809/2452830785.webp',
      specialties: ['Japanese Cars', 'European Cars', 'Filters']
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-300 rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-blue-400 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-200 rounded-full"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Star className="w-4 h-4" />
                Jamaica's #1 Parts Platform
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                Find Car Parts<br />
                <span className="text-yellow-400">Fast & Easy</span>
              </h1>

              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Connect with trusted local suppliers. Get competitive quotes.
                Complete your purchase with confidence in Jamaica.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleRequestPart}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Request Parts Now
                </button>
              </div>
            </div>

            {/* Right Side - Car Parts Image */}
            <div className="relative">
              <div className="bg-gradient-to-br from-cyan-300 to-cyan-500 rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://ext.same-assets.com/394992809/2693083641.webp"
                  alt="Car Parts"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-2">2,500+</div>
              <div className="text-gray-600">Parts Requested</div>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-2">150+</div>
              <div className="text-gray-600">Verified Suppliers</div>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-2">98%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-2">24/7</div>
              <div className="text-gray-600">Platform Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">How PartsFinda Works</h2>
            <p className="text-xl text-gray-600">Get your car parts in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Submit Request</h3>
              <p className="text-gray-600">Upload photo or describe the part you need</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Get Quotes</h3>
              <p className="text-gray-600">Suppliers respond with prices and availability</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Choose Best</h3>
              <p className="text-gray-600">Compare offers and select your preferred supplier</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Complete Deal</h3>
              <p className="text-gray-600">Connect directly with supplier to finalize purchase</p>
            </div>
          </div>
        </div>
      </section>

      {/* Request Form Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Request Your Car Part</h2>
            <p className="text-xl text-gray-600">Get started in minutes with our easy request form</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <Car className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-800">Create Parts Request</h3>
            </div>

            <div className="space-y-6">
              {/* Vehicle Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Information *</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                    <select
                      value={vehicleData.make}
                      onChange={(e) => handleMakeChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a make...</option>
                      {vehicleMakes.map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <select
                      value={vehicleData.model}
                      onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!vehicleData.make}
                    >
                      <option value="">Select a model...</option>
                      {availableModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                      value={vehicleData.year}
                      onChange={(e) => setVehicleData({...vehicleData, year: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select year...</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Part Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Part Name *</label>
                  <input
                    type="text"
                    value={vehicleData.partName}
                    onChange={(e) => setVehicleData({...vehicleData, partName: e.target.value})}
                    placeholder="Brake Pads"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parish *</label>
                  <select
                    value={vehicleData.parish}
                    onChange={(e) => setVehicleData({...vehicleData, parish: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select parish</option>
                    {jamaicaParishes.map(parish => (
                      <option key={parish} value={parish}>{parish}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OEM Number</label>
                <input
                  type="text"
                  value={vehicleData.oemNumber}
                  onChange={(e) => setVehicleData({...vehicleData, oemNumber: e.target.value})}
                  placeholder="45022-SDA-A00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={vehicleData.notes}
                  onChange={(e) => setVehicleData({...vehicleData, notes: e.target.value})}
                  placeholder="Additional requirements..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Sign In Required */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Sign in required to submit requests</h4>
                <p className="text-blue-700 mb-4">Create an account or sign in to get quotes from suppliers</p>
                <Link
                  href="/auth/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  Sign In to Submit Request
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Parts */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Most Requested Parts</h2>
            <p className="text-xl text-gray-600">Popular car parts in Jamaica with average prices</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {popularParts.map((part) => (
              <div key={part.name} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <img
                  src={part.image}
                  alt={part.name}
                  className="w-24 h-24 object-contain mx-auto mb-4"
                />
                <h3 className="font-bold text-lg text-gray-800 mb-2">{part.name}</h3>
                <div className="text-2xl font-bold text-green-600 mb-1">{part.price}</div>
                <div className="text-sm text-gray-500">Average price</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Suppliers */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Verified Suppliers</h2>
            <p className="text-xl text-gray-600">Trusted car parts suppliers across Jamaica</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {suppliers.map((supplier) => (
              <div key={supplier.name} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative">
                  <img
                    src={supplier.image}
                    alt={supplier.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Verified
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{supplier.name}</h3>

                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{supplier.location}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(supplier.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {supplier.rating} ({supplier.reviews})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {supplier.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors">
                    Contact Supplier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Supplier Membership Plans</h2>
            <p className="text-xl text-gray-600">Choose the plan that works best for your business</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Free</h3>
              <div className="text-4xl font-bold text-green-600 mb-6">
                J$0<span className="text-lg text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Basic listing</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>24-hour response delay</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Email notifications</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Basic analytics</span>
                </li>
              </ul>

              <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors">
                Get Started
              </button>
            </div>

            {/* Basic Plan */}
            <div className="bg-white border-2 border-green-500 rounded-lg p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">Basic</h3>
              <div className="text-4xl font-bold text-green-600 mb-6">
                J$2,500<span className="text-lg text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Priority listing</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Instant notifications</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Customer support</span>
                </li>
              </ul>

              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors">
                Get Started
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Premium</h3>
              <div className="text-4xl font-bold text-green-600 mb-6">
                J$5,000<span className="text-lg text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Top placement</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Featured supplier badge</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Bulk messaging</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Dedicated account manager</span>
                </li>
              </ul>

              <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Become a Supplier CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Grow Your Parts Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join Jamaica's premier car parts marketplace and connect with thousands of buyers
          </p>
          <Link
            href="/auth/seller-register"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
          >
            Become a Verified Supplier
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-green-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-8">Get In Touch</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="text-white">
              <Mail className="w-12 h-12 mx-auto mb-4" />
              <div className="text-xl font-semibold">info@partsfinda.com</div>
            </div>
            <div className="text-white">
              <Phone className="w-12 h-12 mx-auto mb-4" />
              <div className="text-xl font-semibold">+876 219 3329</div>
            </div>
            <div className="text-white">
              <MapPin className="w-12 h-12 mx-auto mb-4" />
              <div className="text-xl font-semibold">Kingston, Jamaica</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
