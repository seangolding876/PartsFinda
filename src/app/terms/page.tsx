export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <p className="text-gray-600">Effective Date: January 1, 2024</p>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using PartsFinda ("the Platform"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Marketplace Nature</h2>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
              <p className="text-yellow-900 font-semibold mb-2">⚠️ Important Notice:</p>
              <p className="text-yellow-800">
                PartsFinda is an online marketplace that connects buyers with independent sellers of auto parts.
                We are NOT responsible for the actual sale, quality, authenticity, or delivery of parts.
                All transactions are between buyers and sellers directly.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>We do not own, sell, or ship any auto parts</li>
              <li>We do not verify the authenticity or quality of parts listed</li>
              <li>We are not a party to transactions between buyers and sellers</li>
              <li>We provide a platform for connection only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
            <h3 className="text-xl font-semibold mb-2">For Buyers:</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Carefully verify seller credentials before purchasing</li>
              <li>Use secure payment methods (we recommend escrow services)</li>
              <li>Inspect parts upon delivery before accepting</li>
              <li>Report any fraudulent activity immediately</li>
              <li>Understand that all sales are final unless agreed otherwise with seller</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">For Sellers:</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide accurate descriptions and images of parts</li>
              <li>Honor quoted prices and delivery commitments</li>
              <li>Maintain valid business licenses where required</li>
              <li>Respond to buyer inquiries promptly</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Payment and Transactions</h2>
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
              <p className="text-blue-900 font-semibold mb-2">💡 Payment Advice:</p>
              <p className="text-blue-800">
                Buyers should carefully consider payment methods. We recommend:
              </p>
              <ul className="list-disc pl-6 mt-2 text-blue-800">
                <li>Using escrow services for high-value transactions</li>
                <li>Meeting in person for cash transactions in safe locations</li>
                <li>Avoiding wire transfers to unknown parties</li>
                <li>Keeping all payment receipts and communication</li>
              </ul>
            </div>
            <p className="text-gray-700">
              PartsFinda does not process payments directly. All financial transactions occur between buyers and sellers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PARTSFINDA SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, revenue, or data</li>
              <li>Damages arising from transactions between users</li>
              <li>Quality, safety, or legality of listed parts</li>
              <li>Accuracy of listings or user content</li>
              <li>Ability of sellers to sell or buyers to pay</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              Disputes between buyers and sellers should be resolved directly between the parties.
              PartsFinda may, at its discretion, provide assistance but is not obligated to intervene.
            </p>
            <p className="text-gray-700">
              Any disputes with PartsFinda shall be resolved through binding arbitration in Kingston, Jamaica.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Prohibited Activities</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Listing stolen or counterfeit parts</li>
              <li>Providing false or misleading information</li>
              <li>Engaging in fraudulent transactions</li>
              <li>Harassing other users</li>
              <li>Violating any applicable laws</li>
              <li>Circumventing platform fees or policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Account Termination</h2>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate accounts that violate these terms,
              engage in fraudulent activity, or receive multiple complaints.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Governing Law</h2>
            <p className="text-gray-700">
              These terms shall be governed by the laws of Jamaica.
              You consent to the exclusive jurisdiction of the courts in Kingston, Jamaica.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Contact Information</h2>
            <p className="text-gray-700">
              For questions about these terms, contact us at:
            </p>
            <div className="mt-2 text-gray-700">
              <p>Email: support@partsfinda.com</p>
              <p>Phone: 1-876-219-3329</p>
              <p>Address: Kingston, Jamaica</p>
            </div>
          </section>

          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-600">
              By using PartsFinda, you acknowledge that you have read, understood, and agree to these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
