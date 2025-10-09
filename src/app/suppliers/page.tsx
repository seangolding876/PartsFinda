'use client';

import { useState } from 'react';
import { MapPin, Star, Check, Search, Filter, Phone, Mail, Clock, Award } from 'lucide-react';

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParish, setSelectedParish] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const jamaicaParishes = [
    'All Parishes',
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
    'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
    'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
  ];

  const specialties = [
    'All Specialties',
    'Engine Parts', 'Brake Systems', 'Electrical', 'Transmission',
    'Suspension', 'Body Parts', 'Japanese Cars', 'European Cars',
    'German Cars', 'Filters', 'Oil & Fluids', 'Tires & Wheels'
  ];

  const suppliers = [
    {
      id: 1,
      name: 'Kingston Auto Parts',
      location: 'Kingston',
      address: '15 Spanish Town Road, Kingston 11',
      phone: '+876 922-1234',
      email: 'info@kingstonap.com',
      rating: 4.8,
      reviews: 127,
      image: 'https://ext.same-assets.com/394992809/111244731.webp',
      specialties: ['Engine Parts', 'Brake Systems', 'Electrical'],
      description: 'Leading supplier of quality auto parts for over 20 years. Specializing in Japanese and European vehicles.',
      responseTime: '2 hours',
      membershipLevel: 'Premium',
      joinedYear: 2019,
      verified: true
    },
    {
      id: 2,
      name: 'Spanish Town Motors',
      location: 'Spanish Town',
      address: '45 Burke Road, Spanish Town',
      phone: '+876 984-5678',
      email: 'parts@spanishtown.com',
      rating: 4.9,
      reviews: 89,
      image: 'https://ext.same-assets.com/394992809/2388574119.webp',
      specialties: ['Transmission', 'Suspension', 'Body Parts'],
      description: 'Your trusted partner for transmission and suspension parts. Quick delivery across St. Catherine.',
      responseTime: '1 hour',
      membershipLevel: 'Basic',
      joinedYear: 2020,
      verified: true
    },
    {
      id: 3,
      name: 'Montego Bay Auto',
      location: 'Montego Bay',
      address: '23 Gloucester Avenue, Montego Bay',
      phone: '+876 952-9012',
      email: 'contact@mbayauto.com',
      rating: 4.7,
      reviews: 156,
      image: 'https://ext.same-assets.com/394992809/2452830785.webp',
      specialties: ['Japanese Cars', 'European Cars', 'Filters'],
      description: 'Western Jamaica\'s premier auto parts supplier. Extensive inventory of Japanese and European car parts.',
      responseTime: '3 hours',
      membershipLevel: 'Premium',
      joinedYear: 2018,
      verified: true
    },
    {
      id: 4,
      name: 'Auto Excellence',
      location: 'Portmore',
      address: '12 Naggo Head Road, Portmore',
      phone: '+876 988-7654',
      email: 'sales@autoexcellence.com',
      rating: 4.6,
      reviews: 203,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=200&fit=crop',
      specialties: ['German Cars', 'Engine Parts', 'Oil & Fluids'],
      description: 'Specialists in German vehicle parts with fast delivery to Kingston and surrounding areas.',
      responseTime: '4 hours',
      membershipLevel: 'Basic',
      joinedYear: 2021,
      verified: true
    },
    {
      id: 5,
      name: 'Parts Pro Jamaica',
      location: 'May Pen',
      address: '67 Main Street, May Pen',
      phone: '+876 986-3456',
      email: 'info@partsprojamaica.com',
      rating: 4.5,
      reviews: 78,
      image: 'https://images.unsplash.com/photo-1609839864606-9b48c8d79e1b?w=400&h=200&fit=crop',
      specialties: ['Tires & Wheels', 'Brake Systems', 'Suspension'],
      description: 'Central Jamaica\'s go-to supplier for tires, wheels, and safety parts.',
      responseTime: '5 hours',
      membershipLevel: 'Free',
      joinedYear: 2022,
      verified: true
    },
    {
      id: 6,
      name: 'North Coast Parts',
      location: 'Ocho Rios',
      address: '89 Main Street, Ocho Rios',
      phone: '+876 974-2345',
      email: 'orders@northcoastparts.com',
      rating: 4.4,
      reviews: 92,
      image: 'https://images.unsplash.com/photo-1609839864608-8aaae7b10044?w=400&h=200&fit=crop',
      specialties: ['Body Parts', 'Electrical', 'Filters'],
      description: 'Serving St. Ann and surrounding parishes with quality body parts and electrical components.',
      responseTime: '6 hours',
      membershipLevel: 'Basic',
      joinedYear: 2020,
      verified: true
    }
  ];

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.specialties.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesParish = !selectedParish || selectedParish === 'All Parishes' || supplier.location === selectedParish;
    const matchesSpecialty = !selectedSpecialty || selectedSpecialty === 'All Specialties' ||
                            supplier.specialties.includes(selectedSpecialty);

    return matchesSearch && matchesParish && matchesSpecialty;
  });

  const getMembershipBadgeColor = (level: string) => {
    switch (level) {
      case 'Premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Basic': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Award className="w-4 h-4" />
              150+ Verified Suppliers
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Our Verified Suppliers
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Connect with trusted car parts suppliers across Jamaica. All suppliers are verified,
              rated by customers, and committed to providing quality parts and excellent service.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedParish}
              onChange={(e) => setSelectedParish(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {jamaicaParishes.map(parish => (
                <option key={parish} value={parish}>{parish}</option>
              ))}
            </select>

            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Results
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </div>
        </div>
      </section>

      {/* Suppliers Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
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
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold border ${getMembershipBadgeColor(supplier.membershipLevel)}`}>
                    {supplier.membershipLevel}
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
                      {supplier.rating} ({supplier.reviews} reviews)
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{supplier.description}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>Avg. response: {supplier.responseTime}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {supplier.specialties.slice(0, 2).map((specialty) => (
                      <span
                        key={specialty}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                    {supplier.specialties.length > 2 && (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                        +{supplier.specialties.length - 2} more
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-sm">
                      Contact Supplier
                    </button>
                    <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold transition-colors text-sm">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Supplier CTA */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Become a Verified Supplier
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join Jamaica's largest car parts marketplace and grow your business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors">
              Apply Now
            </button>
            <button className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
