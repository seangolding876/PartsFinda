'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedWarranty, setSelectedWarranty] = useState('all');
  const [selectedShipping, setSelectedShipping] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [cartCount, setCartCount] = useState(0);

  // Get search params
  const vinParam = searchParams.get('vin');
  const makeParam = searchParams.get('make');
  const modelParam = searchParams.get('model');
  const yearParam = searchParams.get('year');
  const searchParam = searchParams.get('search');
  const categoryParam = searchParams.get('category');

  // Initialize with search params
  useEffect(() => {
    if (searchParam) setSearchTerm(searchParam);
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [searchParam, categoryParam]);

  // Sample parts data with Jamaican market focus
  const sampleParts = [
    {
      id: '1',
      name: 'Brake Pads - Premium Ceramic for Toyota Corolla',
      price: 8999,
      condition: 'New',
      category: 'Brakes',
      brand: 'Bendix',
      seller_name: 'Kingston Auto Parts',
      seller_rating: 4.8,
      image: '🔧',
      vehicle_compatibility: ['2008-2020 Toyota Corolla', '2010-2018 Toyota Axio'],
      shipping: 'Free Shipping',
      warranty: '1 Year',
      quantity_available: 15,
      location: 'Kingston'
    },
    {
      id: '2',
      name: 'LED Headlight Assembly - Honda Fit/Jazz',
      price: 24999,
      condition: 'New',
      category: 'Lighting',
      brand: 'DEPO',
      seller_name: 'Montego Bay Motors',
      seller_rating: 4.9,
      image: '💡',
      vehicle_compatibility: ['2008-2020 Honda Fit', '2008-2020 Honda Jazz'],
      shipping: 'Next Day',
      warranty: '2 Years',
      quantity_available: 8,
      location: 'Montego Bay'
    },
    {
      id: '3',
      name: 'Air Filter - Nissan Note/Tiida',
      price: 3499,
      condition: 'New',
      category: 'Filters',
      brand: 'K&N',
      seller_name: 'Spanish Town Spares',
      seller_rating: 4.7,
      image: '🌬️',
      vehicle_compatibility: ['Nissan Note', 'Nissan Tiida', 'Nissan March'],
      shipping: 'Standard',
      warranty: '90 Days',
      quantity_available: 25,
      location: 'Spanish Town'
    },
    {
      id: '4',
      name: 'Alternator - Toyota Probox/Succeed',
      price: 18999,
      condition: 'Remanufactured',
      category: 'Electrical',
      brand: 'Denso',
      seller_name: 'Portmore Parts Plus',
      seller_rating: 4.6,
      image: '⚡',
      vehicle_compatibility: ['Toyota Probox', 'Toyota Succeed', 'Toyota Fielder'],
      shipping: 'Free Shipping',
      warranty: '1 Year',
      quantity_available: 5,
      location: 'Portmore'
    },
    {
      id: '5',
      name: 'Shock Absorbers Set - Mitsubishi Lancer',
      price: 29999,
      condition: 'New',
      category: 'Suspension',
      brand: 'KYB',
      seller_name: 'Ocho Rios Auto',
      seller_rating: 4.8,
      image: '🛞',
      vehicle_compatibility: ['2008-2017 Mitsubishi Lancer', 'Mitsubishi Galant'],
      shipping: 'Free Shipping',
      warranty: '2 Years',
      quantity_available: 10,
      location: 'Ocho Rios'
    },
    {
      id: '6',
      name: 'Radiator - Honda CR-V',
      price: 15999,
      condition: 'New',
      category: 'Cooling',
      brand: 'Koyo',
      seller_name: 'Mandeville Motors',
      seller_rating: 4.7,
      image: '❄️',
      vehicle_compatibility: ['2007-2016 Honda CR-V', '2009-2015 Honda Pilot'],
      shipping: 'Next Day',
      warranty: '1 Year',
      quantity_available: 7,
      location: 'Mandeville'
    },
    {
      id: '7',
      name: 'Timing Belt Kit - Suzuki Swift',
      price: 12999,
      condition: 'New',
      category: 'Engine',
      brand: 'Gates',
      seller_name: 'May Pen Parts',
      seller_rating: 4.5,
      image: '⚙️',
      vehicle_compatibility: ['Suzuki Swift', 'Suzuki Baleno', 'Suzuki Vitara'],
      shipping: 'Standard',
      warranty: '6 Months',
      quantity_available: 12,
      location: 'May Pen'
    },
    {
      id: '8',
      name: 'Battery - 12V 60AH for Japanese Cars',
      price: 9999,
      condition: 'New',
      category: 'Batteries',
      brand: 'Exide',
      seller_name: 'Half Way Tree Auto',
      seller_rating: 4.9,
      image: '🔋',
      vehicle_compatibility: ['Most Japanese Vehicles'],
      shipping: 'Free Shipping',
      warranty: '18 Months',
      quantity_available: 30,
      location: 'Half Way Tree'
    }
  ];

  // Fetch parts from API
  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (selectedCondition !== 'all') params.append('condition', selectedCondition);
        if (selectedBrand !== 'all') params.append('brand', selectedBrand);
        if (searchTerm) params.append('search', searchTerm);
        params.append('minPrice', priceRange[0].toString());
        params.append('maxPrice', priceRange[1].toString());

        const response = await fetch(`/api/parts?${params.toString()}`);
        const data = await response.json();

        if (data.parts && data.parts.length > 0) {
          setParts(data.parts);
        } else {
          // Use sample data if no database results
          setParts(sampleParts);
        }
      } catch (error) {
        console.error('Error fetching parts:', error);
        // Fallback to sample data
        setParts(sampleParts);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [selectedCategory, selectedCondition, selectedBrand, searchTerm, priceRange]);

  const categories = [
    'All', 'Brakes', 'Engine', 'Electrical', 'Suspension', 'Cooling', 'Lighting',
    'Exhaust', 'Transmission', 'Fuel System', 'Ignition', 'Body Parts', 'Interior',
    'HVAC', 'Steering', 'Wheels & Tires', 'Batteries', 'Filters', 'Belts & Hoses',
    'Clutch', 'Gaskets', 'Sensors', 'Wipers'
  ];

  const conditions = ['All', 'New', 'Used', 'Remanufactured', 'Refurbished', 'OEM'];
  const brands = ['All', 'OEM', 'Bendix', 'Bosch', 'Denso', 'ACDelco', 'Motorcraft', 'NGK', 'Gates', 'Moog', 'Wagner', 'KYB', 'Monroe', 'Exide', 'Yuasa', 'K&N', 'DEPO', 'Koyo'];
  const warranties = ['All', 'No Warranty', '30 Days', '90 Days', '6 Months', '1 Year', '18 Months', '2 Years', 'Lifetime'];
  const shippingOptions = ['All', 'Free Shipping', 'Same Day', 'Next Day', 'Standard', 'Express'];

  const addToCart = async (part: any) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: part, userId: 'guest' })
      });
      if (response.ok) {
        setCartCount(cartCount + 1);
        alert(`${part.name} added to cart!`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Added to cart (offline mode)');
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedCondition('all');
    setSelectedBrand('all');
    setSelectedWarranty('all');
    setSelectedShipping('all');
    setSelectedRating('all');
    setSearchTerm('');
    setPriceRange([0, 5000]);
  };

  // Filter parts based on selections
  const filteredParts = parts.filter(part => {
    if (selectedShipping !== 'all' && part.shipping?.toLowerCase() !== selectedShipping.toLowerCase()) return false;
    if (selectedWarranty !== 'all' && part.warranty?.toLowerCase() !== selectedWarranty.toLowerCase()) return false;
    if (selectedRating === '4+' && part.seller_rating < 4) return false;
    if (selectedRating === '4.5+' && part.seller_rating < 4.5) return false;
    return true;
  });

  // Sort parts
  const sortedParts = [...filteredParts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.seller_rating - a.seller_rating;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Auto Parts Marketplace</h1>

        {/* Vehicle Info Display */}
        {(vinParam || (makeParam && modelParam && yearParam)) && (
          <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h3 className="font-semibold mb-2">Showing parts for:</h3>
            {vinParam ? (
              <p className="text-lg">VIN: {vinParam}</p>
            ) : (
              <p className="text-lg">{yearParam} {makeParam} {modelParam}</p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Filters</h2>

              {/* Search Box */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Category</h3>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Condition Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Condition</h3>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {conditions.map(cond => (
                    <option key={cond} value={cond.toLowerCase()}>{cond}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Brand</h3>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {brands.map(brand => (
                    <option key={brand} value={brand.toLowerCase()}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Price Range (JMD)</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="w-24 px-2 py-1 border rounded"
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-24 px-2 py-1 border rounded"
                    placeholder="Max"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  $0 - $50,000 JMD
                </div>
              </div>

              {/* Warranty Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Warranty</h3>
                <select
                  value={selectedWarranty}
                  onChange={(e) => setSelectedWarranty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {warranties.map(warranty => (
                    <option key={warranty} value={warranty.toLowerCase()}>{warranty}</option>
                  ))}
                </select>
              </div>

              {/* Shipping Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Shipping</h3>
                <select
                  value={selectedShipping}
                  onChange={(e) => setSelectedShipping(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {shippingOptions.map(option => (
                    <option key={option} value={option.toLowerCase()}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Seller Rating Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Seller Rating</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="radio" name="rating" value="all" className="mr-2"
                      checked={selectedRating === 'all'}
                      onChange={(e) => setSelectedRating(e.target.value)}
                    />
                    All Ratings
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="rating" value="4+" className="mr-2"
                      checked={selectedRating === '4+'}
                      onChange={(e) => setSelectedRating(e.target.value)}
                    />
                    ⭐ 4+ Stars
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="rating" value="4.5+" className="mr-2"
                      checked={selectedRating === '4.5+'}
                      onChange={(e) => setSelectedRating(e.target.value)}
                    />
                    ⭐ 4.5+ Stars
                  </label>
                </div>
              </div>

              <button
                onClick={clearFilters}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Parts Grid */}
          <div className="md:col-span-3">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `Showing ${sortedParts.length} parts`}
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="relevance">Sort by: Best Match</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating: High to Low</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-4xl animate-spin">⚙️</div>
                <p className="mt-4 text-gray-600">Loading parts...</p>
              </div>
            ) : sortedParts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-xl text-gray-600">No parts found matching your criteria</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedParts.map(part => (
                  <div key={part.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                    <div className="p-6">
                      <div className="text-6xl text-center mb-4">{part.image || '🔧'}</div>
                      <h3 className="font-semibold mb-2">{part.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {Array.isArray(part.vehicle_compatibility)
                          ? part.vehicle_compatibility[0]
                          : part.vehicle_compatibility || 'Universal Fit'}
                      </p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-teal-600">
                          ${(part.price || 0).toLocaleString()} JMD
                        </span>
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          {part.condition}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        <p>Seller: {part.seller_name}</p>
                        <p>Rating: ⭐ {part.seller_rating}</p>
                        {part.location && <p>📍 {part.location}</p>}
                        {part.warranty && <p>🛡️ {part.warranty} Warranty</p>}
                        {part.shipping && <p>🚚 {part.shipping}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addToCart(part)}
                          className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700"
                        >
                          Add to Cart
                        </button>
                        <Link
                          href="/messages"
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-center"
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div>Loading marketplace...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
