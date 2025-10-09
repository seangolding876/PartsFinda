export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Returns & Refunds Policy</h1>

        {/* Important Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2 text-yellow-800">Important Notice</h2>
          <p className="text-yellow-700">
            PartsFinda is a marketplace that connects buyers and sellers. Each seller sets their own return
            and refund policies. The information below provides general guidelines, but always confirm the
            specific return policy with the seller before purchasing.
          </p>
        </div>

        {/* General Guidelines */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">General Return Guidelines</h2>
          <p className="text-gray-700 mb-4">
            While individual seller policies may vary, most sellers on PartsFinda follow these general guidelines:
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Returns are typically accepted within 7-30 days of purchase</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Parts must be unused, uninstalled, and in original packaging</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Original receipt or proof of purchase is required</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Restocking fees may apply (typically 10-20%)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Buyer is usually responsible for return shipping costs</span>
            </li>
          </ul>
        </section>

        {/* Return Process */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How to Return a Part</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">1</div>
              <div>
                <h4 className="font-semibold mb-1">Contact the Seller</h4>
                <p className="text-gray-600">Reach out to the seller through the platform within their specified return window</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">2</div>
              <div>
                <h4 className="font-semibold mb-1">Explain the Issue</h4>
                <p className="text-gray-600">Clearly describe why you're returning the part (wrong fitment, defective, etc.)</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">3</div>
              <div>
                <h4 className="font-semibold mb-1">Get Return Authorization</h4>
                <p className="text-gray-600">Wait for the seller to provide return instructions and authorization</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">4</div>
              <div>
                <h4 className="font-semibold mb-1">Package Securely</h4>
                <p className="text-gray-600">Pack the part carefully in its original packaging to prevent damage</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">5</div>
              <div>
                <h4 className="font-semibold mb-1">Ship or Return In-Person</h4>
                <p className="text-gray-600">Follow the seller's instructions for returning the part</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">6</div>
              <div>
                <h4 className="font-semibold mb-1">Receive Refund</h4>
                <p className="text-gray-600">Once verified, the seller will process your refund per their policy</p>
              </div>
            </div>
          </div>
        </section>

        {/* Valid Reasons for Returns */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Valid Reasons for Returns</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-700 mb-2">Generally Accepted</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Wrong part shipped</li>
                <li>• Defective or damaged part</li>
                <li>• Part doesn't match description</li>
                <li>• Compatibility issues (if seller confirmed fit)</li>
                <li>• Missing components</li>
              </ul>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-red-700 mb-2">Usually Not Accepted</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Buyer changed mind</li>
                <li>• Found cheaper elsewhere</li>
                <li>• Installed or used parts</li>
                <li>• Electrical parts (once installed)</li>
                <li>• Special order items</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Refund Methods */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Refund Methods</h2>
          <p className="text-gray-700 mb-4">
            Refunds are typically processed using the original payment method:
          </p>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💵</span>
              <div>
                <h4 className="font-semibold">Cash Purchases</h4>
                <p className="text-gray-600 text-sm">Refunded in cash at seller's location</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏦</span>
              <div>
                <h4 className="font-semibold">Bank Transfer</h4>
                <p className="text-gray-600 text-sm">Refunded to original bank account (3-5 business days)</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">💳</span>
              <div>
                <h4 className="font-semibold">Card Payments</h4>
                <p className="text-gray-600 text-sm">Credited back to original card (5-10 business days)</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">📱</span>
              <div>
                <h4 className="font-semibold">Mobile Money</h4>
                <p className="text-gray-600 text-sm">Returned to mobile wallet (1-2 business days)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tips for Buyers */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Tips to Avoid Returns</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-blue-600">Before Purchasing</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>✓ Verify part numbers carefully</li>
                <li>✓ Use VIN decoder for exact fitment</li>
                <li>✓ Ask seller about compatibility</li>
                <li>✓ Read seller's return policy</li>
                <li>✓ Check seller ratings and reviews</li>
                <li>✓ Compare multiple listings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-blue-600">Upon Receiving</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>✓ Inspect immediately upon receipt</li>
                <li>✓ Check for damage or missing parts</li>
                <li>✓ Verify part numbers match</li>
                <li>✓ Test fitment before installation</li>
                <li>✓ Keep all packaging and receipts</li>
                <li>✓ Document with photos if issues</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Dispute Resolution */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
          <p className="text-gray-700 mb-4">
            If you cannot resolve a return issue directly with the seller:
          </p>
          <ol className="space-y-3 text-gray-700">
            <li>
              <strong>1. Document Everything:</strong> Keep all messages, receipts, photos, and correspondence
            </li>
            <li>
              <strong>2. Contact PartsFinda Support:</strong> Email us at support@partsfinda.com with details
            </li>
            <li>
              <strong>3. Mediation:</strong> We'll work with both parties to find a fair resolution
            </li>
            <li>
              <strong>4. Report Issues:</strong> Flag problematic sellers to protect other buyers
            </li>
          </ol>
        </section>

        {/* Seller-Specific Policies */}
        <section className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Understanding Seller Policies</h2>
          <p className="text-gray-700 mb-4">
            Each seller may have different policies regarding:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded p-4">
              <h4 className="font-semibold mb-2">Return Window</h4>
              <p className="text-gray-600 text-sm">From 7 to 30 days typically</p>
            </div>
            <div className="bg-white rounded p-4">
              <h4 className="font-semibold mb-2">Restocking Fees</h4>
              <p className="text-gray-600 text-sm">0% to 25% of purchase price</p>
            </div>
            <div className="bg-white rounded p-4">
              <h4 className="font-semibold mb-2">Shipping Costs</h4>
              <p className="text-gray-600 text-sm">Buyer or seller responsibility</p>
            </div>
          </div>
          <p className="text-gray-700 mt-4">
            <strong>Always check the specific seller's return policy before purchasing!</strong>
          </p>
        </section>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Need Help with a Return?</h2>
          <p className="mb-4">
            Our support team is here to help resolve any issues between buyers and sellers.
          </p>
          <a
            href="mailto:support@partsfinda.com"
            className="inline-block bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Contact Support
          </a>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 p-4 bg-gray-100 rounded text-sm text-gray-600">
          <p>
            <strong>Disclaimer:</strong> PartsFinda facilitates connections between buyers and sellers but is not
            responsible for individual transactions. All sales are between the buyer and seller directly. We encourage
            both parties to communicate clearly and honor agreed-upon terms.
          </p>
        </div>
      </div>
    </div>
  );
}
