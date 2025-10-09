export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <p className="text-gray-600">Last Updated: January 1, 2024</p>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-gray-700">
              PartsFinda Inc. ("we," "our," or "us") respects your privacy and is committed to protecting your personal data.
              This privacy policy explains how we collect, use, and share your information when you use our marketplace platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-2">Information You Provide:</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Name and contact information (email, phone number, address)</li>
              <li>Account credentials (username, password)</li>
              <li>Vehicle information (make, model, year, VIN)</li>
              <li>Payment information (processed by third-party providers)</li>
              <li>Communications with other users</li>
              <li>Reviews and ratings</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">Information We Collect Automatically:</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent on platform</li>
              <li>Search queries and browsing behavior</li>
              <li>Location data (with your permission)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Facilitate connections between buyers and sellers</li>
              <li>Process and manage your account</li>
              <li>Send notifications about part requests and quotes</li>
              <li>Improve our services and user experience</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Information Sharing</h2>

            <h3 className="text-xl font-semibold mb-2">We share your information with:</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Other Users:</strong> Buyers and sellers can see certain profile information to facilitate transactions</li>
              <li><strong>Service Providers:</strong> Companies that help us operate our platform (hosting, email, analytics)</li>
              <li><strong>Payment Processors:</strong> To facilitate transactions (Stripe, PayPal, etc.)</li>
              <li><strong>Law Enforcement:</strong> When required by law or to protect rights and safety</li>
            </ul>

            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
              <p className="text-blue-900 font-semibold mb-2">ℹ️ Important:</p>
              <p className="text-blue-800">
                We do NOT sell your personal information to third parties for their marketing purposes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Limited access to personal information</li>
              <li>Secure data centers and hosting providers</li>
            </ul>
            <p className="text-gray-700 mt-4">
              However, no method of transmission over the internet is 100% secure.
              We cannot guarantee absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Download your data in a portable format</li>
              <li>Object to certain uses of your information</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us at support@partsfinda.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze platform usage</li>
              <li>Provide targeted advertisements</li>
            </ul>
            <p className="text-gray-700 mt-4">
              You can control cookies through your browser settings, but disabling cookies may limit functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700">
              Our services are not directed to individuals under 18.
              We do not knowingly collect personal information from children.
              If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700">
              Your information may be transferred to and processed in countries other than Jamaica.
              By using our platform, you consent to these transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Data Retention</h2>
            <p className="text-gray-700">
              We retain your information for as long as necessary to provide our services and comply with legal obligations.
              After account deletion, we may retain certain information for legal and business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy from time to time.
              We will notify you of significant changes via email or platform notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this privacy policy or our data practices, contact us at:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700"><strong>PartsFinda Inc.</strong></p>
              <p className="text-gray-700">Email: support@partsfinda.com</p>
              <p className="text-gray-700">Phone: 1-876-219-3329</p>
              <p className="text-gray-700">Address: Kingston, Jamaica</p>
            </div>
          </section>

          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-600">
              By using PartsFinda, you agree to the collection and use of information in accordance with this policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
