export default function FAQPage() {
  const faqs = [
    {
      category: "General",
      questions: [
        {
          q: "What is PartsFinda?",
          a: "PartsFinda is Jamaica's premier online marketplace for auto parts, connecting buyers with verified sellers across the island. We make it easy to find genuine parts for your vehicle at competitive prices."
        },
        {
          q: "How does PartsFinda work?",
          a: "Simply search for the parts you need using our search tools, browse listings from verified sellers, compare prices, and contact sellers directly through our platform. You can search by part name, vehicle make/model, or even use our AI-powered visual search."
        },
        {
          q: "Is PartsFinda available across all of Jamaica?",
          a: "Yes! PartsFinda connects buyers and sellers from all parishes in Jamaica. Sellers can specify their location and shipping options, making it easy to find parts locally or arrange island-wide delivery."
        }
      ]
    },
    {
      category: "Buying Parts",
      questions: [
        {
          q: "How do I search for parts?",
          a: "You can search for parts in multiple ways: Use the search bar for specific part names, filter by vehicle make/model/year, browse by category, use our VIN decoder to find compatible parts, or try our AI visual search by uploading a photo of the part you need."
        },
        {
          q: "How do I know if a part will fit my vehicle?",
          a: "Each listing includes compatibility information. You can use our VIN decoder to identify your exact vehicle specifications, or contact the seller directly through the platform to confirm fitment. Always double-check part numbers when available."
        },
        {
          q: "What payment methods are accepted?",
          a: "Payment methods vary by seller and may include cash, bank transfer, credit/debit cards, or mobile money. Payment arrangements are made directly between buyers and sellers. We recommend using secure payment methods and getting receipts for all transactions."
        },
        {
          q: "Can I return parts if they don't fit?",
          a: "Return policies are set by individual sellers. Always check the seller's return policy before purchasing. We recommend clarifying return conditions, warranty terms, and any restocking fees with the seller before completing your purchase."
        }
      ]
    },
    {
      category: "Selling Parts",
      questions: [
        {
          q: "How do I become a seller on PartsFinda?",
          a: "Click on 'Become a Seller' to create your seller account. Choose your subscription plan (Basic, Professional, or Enterprise), complete the verification process, and start listing your parts. Verified sellers get a badge that builds buyer trust."
        },
        {
          q: "What are the seller subscription tiers?",
          a: "We offer three tiers: Basic (Free) - List up to 10 parts, standard visibility. Professional (JMD $2,500/month) - Unlimited listings, priority in search results, instant notifications. Enterprise (JMD $5,000/month) - All Professional features plus premium placement, bulk upload tools, and dedicated support."
        },
        {
          q: "How do I get verified as a seller?",
          a: "Verification requires submitting business documentation (TRN/BRN), proof of address, and passing our seller quality checks. Verified sellers receive a badge on their listings and typically see 3x more buyer inquiries."
        },
        {
          q: "Can I upload multiple parts at once?",
          a: "Yes! Professional and Enterprise sellers can use our bulk upload feature to add multiple parts via CSV or Excel file. This saves time when managing large inventories."
        }
      ]
    },
    {
      category: "VIN Decoder & AI Search",
      questions: [
        {
          q: "What is a VIN and where do I find it?",
          a: "A VIN (Vehicle Identification Number) is a unique 17-character code that identifies your specific vehicle. You can find it on your dashboard (visible through the windshield), driver's side door jamb, vehicle registration, or insurance documents."
        },
        {
          q: "How does the VIN decoder work?",
          a: "Enter your 17-character VIN and our decoder will instantly identify your vehicle's make, model, year, engine type, and trim level. This information helps you find parts that are guaranteed to fit your specific vehicle."
        },
        {
          q: "How does AI visual search work?",
          a: "Simply upload a photo of the part you need, and our AI will analyze it to find matching or similar parts in our marketplace. This is perfect when you don't know the exact part name or number."
        },
        {
          q: "What types of images work best for AI search?",
          a: "For best results, use clear, well-lit photos showing the entire part. Include any visible part numbers or labels. Multiple angles can help improve match accuracy. Avoid blurry or dark images."
        }
      ]
    },
    {
      category: "Safety & Trust",
      questions: [
        {
          q: "How do I know sellers are legitimate?",
          a: "Look for the 'Verified Seller' badge on listings. Verified sellers have submitted business documentation and passed our quality checks. Also check seller ratings and reviews from other buyers."
        },
        {
          q: "What if I encounter a fraudulent seller?",
          a: "Report suspicious activity immediately using the 'Report' button on any listing or contact us at support@partsfinda.com. We investigate all reports and take action against fraudulent accounts."
        },
        {
          q: "How is my personal information protected?",
          a: "We use industry-standard encryption to protect your data. Personal information is never shared with third parties without your consent. Sellers only see the contact information you choose to share when inquiring about parts."
        },
        {
          q: "What should I do before meeting a seller in person?",
          a: "Always meet in safe, public locations during daylight hours. Bring someone with you if possible. Inspect parts carefully before payment. Never send money before seeing the part. Trust your instincts - if something feels wrong, don't proceed."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "The website isn't loading properly. What should I do?",
          a: "Try clearing your browser cache and cookies, disable browser extensions temporarily, try a different browser, or check your internet connection. If problems persist, contact support@partsfinda.com."
        },
        {
          q: "How do I reset my password?",
          a: "Click 'Forgot Password' on the login page, enter your email address, check your email for a reset link (check spam folder too), and follow the instructions to create a new password."
        },
        {
          q: "Can I use PartsFinda on my mobile device?",
          a: "Yes! PartsFinda is fully mobile-responsive and works on all modern smartphones and tablets. You can access all features through your mobile browser."
        },
        {
          q: "How do I contact customer support?",
          a: "Email us at support@partsfinda.com for assistance. Include your account email and a detailed description of your issue for faster resolution."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
          <p className="text-blue-700">
            Can't find what you're looking for? Contact us at{' '}
            <a href="mailto:support@partsfinda.com" className="font-semibold underline">
              support@partsfinda.com
            </a>
          </p>
        </div>

        {faqs.map((section, idx) => (
          <div key={idx} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">{section.category}</h2>
            <div className="space-y-4">
              {section.questions.map((item, qIdx) => (
                <div key={qIdx} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-lg mb-2">{item.q}</h3>
                  <p className="text-gray-700 whitespace-pre-line">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
          <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
          <p className="mb-4">
            Our support team is here to help you get the most out of PartsFinda.
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
