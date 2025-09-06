'use client';

import { useState } from 'react';

export default function VisualSearchPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = () => {
    setIsSearching(true);
    // Simulate AI search
    setTimeout(() => {
      setSearchResults([
        {
          id: 1,
          name: 'Brake Rotor - Front',
          confidence: 95,
          price: 129.99,
          seller: 'AutoParts Pro',
          image: '🔧'
        },
        {
          id: 2,
          name: 'Performance Brake Rotor',
          confidence: 88,
          price: 159.99,
          seller: 'Speed Shop',
          image: '🔧'
        },
        {
          id: 3,
          name: 'OEM Replacement Rotor',
          confidence: 82,
          price: 99.99,
          seller: 'Factory Direct',
          image: '🔧'
        }
      ]);
      setIsSearching(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">AI Visual Search</h1>

          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">📸</div>
                <h2 className="text-2xl font-semibold mb-2">Upload Part Image</h2>
                <p className="text-gray-600">Take a photo or upload an image of the auto part you're looking for</p>
              </div>

              {!selectedImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
                  >
                    Choose Image
                  </label>
                  <p className="text-sm text-gray-500 mt-4">
                    Supported formats: JPG, PNG, GIF (Max 10MB)
                  </p>
                </div>
              ) : (
                <div>
                  <img
                    src={selectedImage}
                    alt="Uploaded part"
                    className="max-w-full h-64 object-contain mx-auto mb-4 rounded-lg"
                  />
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSearching ? 'Searching...' : 'Search for Similar Parts'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setSearchResults([]);
                      }}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                    >
                      Upload New Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {searchResults.map(result => (
                  <div key={result.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{result.image}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{result.name}</h3>
                        <div className="mb-2">
                          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                            {result.confidence}% Match
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mb-1">${result.price}</p>
                        <p className="text-sm text-gray-600">Seller: {result.seller}</p>
                        <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="mt-12 bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">📱</div>
                <h3 className="font-medium mb-2">1. Upload Image</h3>
                <p className="text-sm text-gray-600">Take a photo or upload an image of the part</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="font-medium mb-2">2. AI Analysis</h3>
                <p className="text-sm text-gray-600">Our AI identifies and matches your part</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-medium mb-2">3. Get Results</h3>
                <p className="text-sm text-gray-600">View matching parts from verified sellers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
