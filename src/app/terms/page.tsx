export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Effective Date: December 2025</p>
        
        <div className="bg-white rounded-lg shadow p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Welcome to PartsFinda</h2>
            <p className="text-gray-700 mb-4">
              Welcome to PartsFinda, Jamaica's #1 car parts platform. These Terms of Service ("Terms") govern your use of our website at www.partsfinda.com and our services. By using our platform, you agree to these Terms.
            </p>
            <p className="text-gray-700 mb-4">
              PartsFinda operates an online marketplace connecting car owners with verified local suppliers across all parishes in Jamaica. We facilitate connections between buyers and sellers but are not a party to any transactions between users.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="bg-blue-50 p-5 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-3">For Buyers:</h3>
                <ul className="space-y-2 text-blue-700">
                  <li>• Submit part requests with photos or descriptions</li>
                  <li>• Receive competitive quotes from verified suppliers</li>
                  <li>• Complete deals directly with suppliers</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-5 rounded-lg">
                <h3 className="font-bold text-green-800 mb-3">For Suppliers:</h3>
                <ul className="space-y-2 text-green-700">
                  <li>• Access membership plans from free basic listings to premium featured placements</li>
                  <li>• Respond to customer requests</li>
                  <li>• Manage your supplier profile</li>
                </ul>
              </div>
            </div>
            
            <p className="text-gray-700">
              You must be at least 18 years old to use PartsFinda. By using our platform, you confirm you meet this age requirement and have the legal capacity to enter into these Terms.
            </p>
          </section>

          <section>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 mb-6">
              <h2 className="text-xl font-bold text-yellow-900 mb-3">Important Notice:</h2>
              <p className="text-yellow-800 mb-3">
                PartsFinda is a marketplace platform only. We do not sell car parts directly, set prices, or control the quality of parts or services offered by suppliers. We are not responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-yellow-800">
                <li>Quality, safety, or legality of parts offered</li>
                <li>Truth or accuracy of listings or supplier information</li>
                <li>Ability of suppliers to complete transactions</li>
                <li>Actual transactions between buyers and suppliers</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Verified Suppliers</h2>
            <p className="text-gray-700 mb-4">
              While we promote "verified suppliers," our verification process focuses on confirming a supplier's identity and basic business details.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 p-5 rounded-lg">
                <h3 className="font-bold text-green-800 mb-3">What We Typically Check:</h3>
                <ul className="space-y-2 text-green-700">
                  <li>• Business registration details and trading name (where applicable)</li>
                  <li>• Primary phone number and email address are reachable</li>
                  <li>• Business address/location and a public web or social presence (where available)</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-5 rounded-lg">
                <h3 className="font-bold text-red-800 mb-3">What We Do NOT Check or Guarantee:</h3>
                <ul className="space-y-2 text-red-700">
                  <li>• Product quality, authenticity, or fitment for your vehicle</li>
                  <li>• Inventory levels, pricing accuracy, or delivery times</li>
                  <li>• Creditworthiness, financial standing, or criminal background</li>
                  <li>• Insurance cover, workshop/facility inspections, or manufacturer/OEM certifications</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-3">Important Notes:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Verification is a point-in-time check and may be updated or withdrawn if information changes</li>
                <li>• Suppliers remain solely responsible for their listings and performance</li>
                <li>• Buyers should request invoices/receipts, confirm part numbers/fitment, and exercise due diligence before paying</li>
              </ul>
              <p className="mt-3 text-gray-700 font-medium">
                PartsFinda does not endorse any supplier, and verification is not a warranty.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">User Responsibilities</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">For All Users:</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide accurate, current information</li>
                <li>Respect intellectual property rights</li>
                <li>Use the platform lawfully and ethically</li>
                <li>Maintain security of your account credentials</li>
              </ul>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-blue-800">For Buyers:</h3>
                <ul className="space-y-2 text-blue-700">
                  <li>• Verify part compatibility before purchase</li>
                  <li>• Inspect parts upon delivery when possible</li>
                  <li>• Communicate directly with suppliers about specifications</li>
                  <li>• Complete transactions in good faith</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-green-800">For Suppliers:</h3>
                <ul className="space-y-2 text-green-700">
                  <li>• Provide accurate part descriptions and pricing</li>
                  <li>• Maintain current inventory information</li>
                  <li>• Respond promptly to customer inquiries</li>
                  <li>• Honor quoted prices and delivery commitments</li>
                  <li>• Ensure parts meet applicable safety standards</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Prohibited Activities</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Post false, misleading, or fraudulent information</li>
              <li>Engage in illegal activities or violate any laws</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to circumvent platform security measures</li>
              <li>Upload malicious software or spam</li>
              <li>Infringe on intellectual property rights</li>
              <li>Use automated systems to access the platform without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Ownership of the site and content:</h3>
                <p className="text-gray-700">
                  The PartsFinda website and services, including all text, graphics, images, software, code, databases, and the overall look and feel, are owned by PartsFinda or our licensors and are protected by Jamaican and international intellectual property laws. You may use the platform only for its intended purposes. You may not copy, modify, distribute, sell, or create derivative works from our content without our prior written permission.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Trademarks:</h3>
                <p className="text-gray-700">
                  "PartsFinda", our logos, and related names, designs, and slogans are trademarks of PartsFinda. Other names, logos, and marks appearing on the platform are the property of their respective owners. You may not use any trademark without the owner's permission.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">User-uploaded content:</h3>
                <p className="text-gray-700">
                  You retain ownership of the content you upload or submit (including photos, descriptions, messages, and reviews). By uploading, you grant PartsFinda a worldwide, non-exclusive, royalty-free, transferable, and sublicensable license to host, store, use, reproduce, modify for formatting, create derivative works, publish, display, and distribute your content in connection with operating, improving, and promoting the platform and our services. You represent that you have all rights necessary to grant this license and that your content does not infringe any third-party rights or applicable laws. We may remove or disable content that we believe violates these Terms or others' rights.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Privacy & Data Protection</h2>
            <div className="bg-gray-50 p-5 rounded-lg">
              <p className="text-gray-700 mb-4">
                We are committed to protecting your data. In short:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Data we collect:</h3>
                  <p className="text-gray-700">
                    account details (e.g., name, email, phone), supplier business information, part requests and photos, messages between users, and technical/usage data (cookies, device and log information).
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">How we use it:</h3>
                  <p className="text-gray-700">
                    to operate and improve the platform, connect buyers and suppliers, send notifications and service updates, provide customer support, detect and prevent fraud or misuse, comply with legal obligations, and (with your consent where required) send marketing communications.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Sharing:</h3>
                  <p className="text-gray-700">
                    we share data with other users as needed to fulfill requests (for example, sharing a buyer's request with suppliers), with service providers who help us run the platform, with authorities when required by law, and in connection with corporate transactions. We do not sell personal data.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Security:</h3>
                  <p className="text-gray-700">
                    we use reasonable administrative, technical, and organizational safeguards to protect your data, but no method is 100% secure.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Retention and choices:</h3>
                  <p className="text-gray-700">
                    we keep data only as long as needed for the purposes above and applicable law, then delete or anonymize it. You may access, update, or request deletion of your information and manage communication preferences, subject to legal limitations.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-white rounded border">
                <p className="text-gray-700">
                  For full details, please see our Privacy Policy at{' '}
                  <a href="https://www.partsfinda.com/privacy" className="text-blue-600 hover:text-blue-800 underline">
                    https://www.partsfinda.com/privacy
                  </a>
                  . By using PartsFinda, you consent to the practices described there.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Payments & Transactions</h2>
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-5">
              <ul className="space-y-3 text-blue-800">
                <li>• All payments occur directly between buyers and suppliers</li>
                <li>• PartsFinda does not process payments or hold funds</li>
                <li>• Users are responsible for resolving payment disputes</li>
                <li>• Exercise caution with advance payments</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              PartsFinda encourages direct communication to resolve disputes. While we may provide guidance, we are not obligated to mediate disputes between users. For unresolved issues, users may pursue resolution through Jamaica's legal system.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, PartsFinda shall not be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Direct, indirect, incidental, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Damages exceeding fees paid to PartsFinda (if any)</li>
              <li>Actions or omissions of platform users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Indemnification</h2>
            <p className="text-gray-700">
              Users agree to indemnify and hold harmless PartsFinda, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
              <li>Your use of the platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of third-party rights</li>
              <li>Content you upload or transmit through the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Modification of Terms</h2>
            <p className="text-gray-700">
              PartsFinda reserves the right to modify these Terms at any time. We will provide notice of material changes by posting updated Terms on our website with a new effective date. Continued use of the platform after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Account Termination</h2>
            <p className="text-gray-700">
              PartsFinda may suspend or terminate accounts that violate these Terms. Users may close accounts at any time by contacting us. Termination does not relieve users of obligations incurred before termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of Jamaica. Any disputes arising from these Terms or platform use shall be resolved in the courts of Jamaica.
            </p>
            <p className="text-gray-700">
              If any provision of these Terms is found unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-3">
              For questions about these Terms or our services, contact us at:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>• Website: www.partsfinda.com</li>
              <li>• Location: Jamaica</li>
            </ul>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-700 font-medium">
              By using PartsFinda, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}