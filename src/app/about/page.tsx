export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">About PartsFinda</h1>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Jamaica's Premier Auto Parts Marketplace</h2>
          <p className="text-lg">
            Connecting buyers and sellers across the island to make finding quality auto parts easier,
            faster, and more reliable than ever before.
          </p>
        </div>

        {/* Our Story */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-700 mb-4">
            PartsFinda was born out of frustration with the traditional auto parts shopping experience in Jamaica.
            We saw countless drivers spending hours calling shops, driving across parishes, and struggling to find
            the right parts for their vehicles.
          </p>
          <p className="text-gray-700 mb-4">
            Founded in 2024, we set out to create a centralized platform where Jamaicans could easily find,
            compare, and purchase auto parts from verified sellers across the island. Our goal was simple:
            make finding auto parts as easy as ordering food online.
          </p>
          <p className="text-gray-700">
            Today, PartsFinda connects thousands of buyers with hundreds of verified sellers, offering everything
            from brake pads to engine components, all with the convenience of online browsing and local pickup or delivery.
          </p>
        </section>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-600">Our Mission</h3>
            <p className="text-gray-700">
              To revolutionize the auto parts industry in Jamaica by creating a trusted, efficient marketplace
              that connects buyers with quality parts and reliable sellers, saving time and money for everyone involved.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-600">Our Vision</h3>
            <p className="text-gray-700">
              To become the Caribbean's leading automotive marketplace, where every driver can find the parts
              they need within minutes, and every seller can grow their business through our platform.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Why Choose PartsFinda?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h4 className="font-semibold mb-1">Verified Sellers</h4>
                <p className="text-gray-600 text-sm">All sellers are vetted and verified for authenticity</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🔍</span>
              <div>
                <h4 className="font-semibold mb-1">Smart Search</h4>
                <p className="text-gray-600 text-sm">VIN decoder and AI visual search for accurate results</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🏝️</span>
              <div>
                <h4 className="font-semibold mb-1">Island-Wide Coverage</h4>
                <p className="text-gray-600 text-sm">Sellers from all 14 parishes of Jamaica</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">💰</span>
              <div>
                <h4 className="font-semibold mb-1">Competitive Prices</h4>
                <p className="text-gray-600 text-sm">Compare prices from multiple sellers instantly</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🛡️</span>
              <div>
                <h4 className="font-semibold mb-1">Secure Platform</h4>
                <p className="text-gray-600 text-sm">Protected transactions and verified communications</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">📱</span>
              <div>
                <h4 className="font-semibold mb-1">Mobile Friendly</h4>
                <p className="text-gray-600 text-sm">Access from any device, anywhere, anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Core Values</h2>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Trust & Transparency</h4>
              <p className="text-gray-700">
                We believe in building trust through transparency. Every seller is verified, every transaction
                is protected, and every review is genuine.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Community First</h4>
              <p className="text-gray-700">
                We're committed to supporting the Jamaican automotive community, from individual drivers to
                professional mechanics and parts suppliers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Innovation</h4>
              <p className="text-gray-700">
                We continuously innovate with features like AI visual search and VIN decoding to make finding
                parts easier than ever.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Customer Success</h4>
              <p className="text-gray-700">
                Your success is our success. Whether you're buying or selling, we're here to ensure you have
                the best possible experience.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
          <p className="text-gray-700 mb-4">
            PartsFinda is powered by a dedicated team of automotive enthusiasts, technology experts, and
            customer service professionals who are passionate about transforming the auto parts industry in Jamaica.
          </p>
          <p className="text-gray-700">
            From our headquarters in Kingston, we work tirelessly to ensure that every user has access to
            quality parts, reliable sellers, and exceptional service.
          </p>
        </section>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Join the PartsFinda Community</h2>
          <p className="mb-6">
            Whether you're a buyer looking for parts or a seller wanting to grow your business,
            we're here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/marketplace"
              className="inline-block bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Browse Parts
            </a>
            <a
              href="/auth/seller-register"
              className="inline-block bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-800 transition"
            >
              Become a Seller
            </a>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-600">
          <p>Have questions? Contact us at{' '}
            <a href="mailto:support@partsfinda.com" className="text-blue-600 underline">
              support@partsfinda.com
            </a>
          </p>
          <p className="mt-2">
            PartsFinda - Driving Jamaica Forward, One Part at a Time
          </p>
        </div>
      </div>
    </div>
  );
}
