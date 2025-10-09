'use client';

import { useState } from 'react';
import { Search, Filter, Star, MapPin, Truck, Clock, Heart, ShoppingCart, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ShopPartsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const categories = [
    'All Categories',
    'Engine Parts', 'Brake Systems', 'Suspension', 'Electrical',
    'Transmission', 'Body Parts', 'Filters', 'Oil & Fluids',
    'Tires & Wheels', 'Exhaust System', 'Cooling System'
  ];

  const makes = [
    'All Makes',
    'Toyota', 'Honda', 'Nissan', 'Mitsubishi', 'BMW', 'Mercedes-Benz',
    'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Hyundai', 'Kia'
  ];

  const priceRanges = [
    'All Prices',
    'Under J$5,000',
    'J$5,000 - J$15,000',
    'J$15,000 - J$30,000',
    'J$30,000 - J$50,000',
    'Over J$50,000'
  ];

  const parts = [
    {
      id: 1,
      name: 'Premium Brake Pads Set',
      category: 'Brake Systems',
      make: 'Toyota',
      model: 'Camry 2018-2024',
      price: 'J$8,500',
      originalPrice: 'J$10,000',
      image: 'https://ext.same-assets.com/394992809/2530530056.webp',
      supplier: 'Kingston Auto Parts',
      location: 'Kingston',
      rating: 4.8,
      reviews: 24,
      condition: 'New',
      inStock: true,
      partNumber: 'BRK-TOY-CAM-001',
      description: 'High-quality ceramic brake pads with excellent stopping power and minimal dust.',
      features: ['Ceramic compound', 'Low noise', 'Extended life', '2-year warranty']
    },
    {
      id: 2,
      name: 'Engine Oil Filter',
      category: 'Filters',
      make: 'Honda',
      model: 'Civic 2016-2023',
      price: 'J$2,200',
      image: 'https://ext.same-assets.com/394992809/1815990976.webp',
      supplier: 'Spanish Town Motors',
      location: 'Spanish Town',
      rating: 4.9,
      reviews: 67,
      condition: 'New',
      inStock: true,
      partNumber: 'OIL-HON-CIV-002',
      description: 'Genuine Honda oil filter for optimal engine protection and performance.',
      features: ['OEM quality', 'Perfect fit', 'High filtration', '1-year warranty']
    },
    {
      id: 3,
      name: 'Spark Plugs (Set of 4)',
      category: 'Engine Parts',
      make: 'Nissan',
      model: 'Altima 2019-2024',
      price: 'J$1,800',
      originalPrice: 'J$2,400',
      image: 'https://ext.same-assets.com/394992809/3306996441.webp',
      supplier: 'Auto Excellence',
      location: 'Portmore',
      rating: 4.6,
      reviews: 43,
      condition: 'New',
      inStock: true,
      partNumber: 'SPK-NIS-ALT-003',
      description: 'Premium iridium spark plugs for enhanced fuel economy and performance.',
      features: ['Iridium tips', 'Long lasting', 'Better fuel economy', '3-year warranty']
    },
    {
      id: 4,
      name: 'Air Filter Element',
      category: 'Filters',
      make: 'BMW',
      model: '3 Series 2017-2023',
      price: 'J$3,500',
      image: 'https://ext.same-assets.com/394992809/2534202371.webp',
      supplier: 'Montego Bay Auto',
      location: 'Montego Bay',
      rating: 4.7,
      reviews: 18,
      condition: 'New',
      inStock: false,
      partNumber: 'AIR-BMW-3SR-004',
      description: 'High-flow air filter for improved engine breathing and performance.',
      features: ['High-flow design', 'Washable', 'Performance boost', '2-year warranty']
    },
    {
      id: 5,
      name: 'Transmission Fluid ATF',
      category: 'Oil & Fluids',
      make: 'Toyota',
      model: 'Corolla 2014-2022',
      price: 'J$4,200',
      image: 'https://ext.same-assets.com/394992809/3093145333.webp',
      supplier: 'Parts Pro Jamaica',
      location: 'May Pen',
      rating: 4.5,
      reviews: 31,
      condition: 'New',
      inStock: true,
      partNumber: 'ATF-TOY-COR-005',
      description: 'Genuine Toyota ATF for smooth transmission operation and longevity.',
      features: ['OEM specification', 'Heat resistant', 'Long service life', 'Factory approved']
    },
    {
      id: 6,
      name: 'Car Battery 12V 70Ah',
      category: 'Electrical',
      make: 'Honda',
      model: 'Accord 2018-2024',
      price: 'J$12,500',
      originalPrice: 'J$15,000',
      image: 'https://ext.same-assets.com/394992809/1439390553.webp',
      supplier: 'North Coast Parts',
      location: 'Ocho Rios',
      rating: 4.4,
      reviews: 29,
      condition: 'New',
      inStock: true,
      partNumber: 'BAT-HON-ACC-006',
      description: 'Maintenance-free battery with excellent cold cranking performance.',
      features: ['Maintenance-free', 'High CCA', '3-year warranty', 'Calcium technology']
    }
  ];

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         part.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         part.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All Categories' || part.category === selectedCategory;
    const matchesMake = !selectedMake || selectedMake === 'All Makes' || part.make === selectedMake;

    return matchesSearch && matchesCategory && matchesMake;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <ShoppingCart className="w-4 h-4" />
              2,500+ Parts Available
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Shop Car Parts
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Browse thousands of quality auto parts from verified suppliers across Jamaica.
              Find exactly what you need with our advanced search and filtering options.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="py-8 bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search parts, makes, models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {makes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>

            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priceRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
              <Filter className="w-5 h-5" />
              Advanced
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredParts.length} of {parts.length} parts
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
                <option>Most Popular</option>
                <option>Best Rated</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Parts Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredParts.map((part) => (
              <div key={part.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="relative">
                  <img
                    src={part.image}
                    alt={part.name}
                    className="w-full h-48 object-contain bg-gray-50 p-4"
                  />

                  {part.originalPrice && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      SALE
                    </div>
                  )}

                  {!part.inStock && (
                    <div className="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      OUT OF STOCK
                    </div>
                  )}

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50">
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded">
                      {part.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                    {part.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3">
                    {part.make} {part.model}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(part.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">({part.reviews})</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>{part.supplier}, {part.location}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xl font-bold text-green-600">{part.price}</span>
                      {part.originalPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {part.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      part.inStock
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {part.inStock ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/parts/${part.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-sm text-center"
                    >
                      View Details
                    </Link>
                    <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold transition-colors text-sm">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredParts.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">No parts found</h3>
              <p className="text-gray-600 mb-8">
                Try adjusting your search criteria or browse different categories
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedMake('');
                  setPriceRange('');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Load More Button */}
          {filteredParts.length > 0 && (
            <div className="text-center mt-12">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-semibold transition-colors">
                Load More Parts
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Popular Categories</h2>
            <p className="text-lg text-gray-600">Browse parts by category</p>
          </div>

          <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-6">
            {categories.slice(1, 13).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-6 text-center transition-colors group"
              >
                <div className="text-2xl mb-3">🔧</div>
                <div className="font-semibold text-gray-800 group-hover:text-blue-600 text-sm">
                  {category}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-lg text-green-100 mb-8">
            Submit a parts request and let our suppliers find exactly what you need
          </p>
          <Link
            href="/request-part"
            className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
          >
            Request Custom Part
            <Truck className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
