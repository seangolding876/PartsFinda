'use client';

import Link from 'next/link';
import { ArrowRight, Upload, MessageSquare, Search, Handshake, Star, Check, Clock, Shield } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      title: "Submit Request",
      description: "Upload photo or describe the part you need",
      details: [
        "Fill out vehicle information (make, model, year)",
        "Describe the part you need or upload a photo",
        "Include part numbers if available",
        "Specify your location and budget"
      ],
      icon: <Upload className="w-12 h-12 text-blue-600" />,
      color: "bg-blue-100 border-blue-200"
    },
    {
      number: 2,
      title: "Get Quotes",
      description: "Suppliers respond with prices and availability",
      details: [
        "Verified suppliers receive your request instantly",
        "Multiple quotes from different suppliers",
        "See prices, availability, and supplier ratings",
        "Get responses within 24 hours"
      ],
      icon: <MessageSquare className="w-12 h-12 text-green-600" />,
      color: "bg-green-100 border-green-200"
    },
    {
      number: 3,
      title: "Choose Best",
      description: "Compare offers and select your preferred supplier",
      details: [
        "Compare prices from multiple suppliers",
        "Check supplier ratings and reviews",
        "Consider location and delivery options",
        "Select the best overall value"
      ],
      icon: <Search className="w-12 h-12 text-orange-600" />,
      color: "bg-orange-100 border-orange-200"
    },
    {
      number: 4,
      title: "Complete Deal",
      description: "Connect directly with supplier to finalize purchase",
      details: [
        "Contact supplier directly through our platform",
        "Arrange payment and delivery",
        "Get parts with confidence",
        "Leave feedback for other buyers"
      ],
      icon: <Handshake className="w-12 h-12 text-purple-600" />,
      color: "bg-purple-100 border-purple-200"
    }
  ];

  const benefits = [
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      title: "Save Time",
      description: "No more calling multiple shops or driving around town. Post once and get multiple quotes."
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: "Save Money",
      description: "Suppliers compete for your business, ensuring you get the best possible prices."
    },
    {
      icon: <Check className="w-8 h-8 text-orange-600" />,
      title: "Verified Suppliers",
      description: "All suppliers are verified and rated by previous customers for your peace of mind."
    },
    {
      icon: <Star className="w-8 h-8 text-purple-600" />,
      title: "Island-Wide Coverage",
      description: "Access to suppliers from all parishes across Jamaica, expanding your options."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Star className="w-4 h-4" />
              Jamaica's #1 Parts Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              How PartsFinda Works
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Get your car parts in 4 simple steps. Our platform connects you with verified suppliers
              across Jamaica to ensure you find exactly what you need at the best price.
            </p>
            <Link
              href="/request-part"
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors inline-flex items-center gap-2"
            >
              Start Your Request
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Simple 4-Step Process
            </h2>
            <p className="text-xl text-gray-600">
              From request to delivery, we make finding car parts fast and easy
            </p>
          </div>

          <div className="space-y-16">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}
              >
                {/* Content */}
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-600">{step.number}</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-800">{step.title}</h3>
                      <p className="text-lg text-gray-600">{step.description}</p>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>

                  {step.number === 1 && (
                    <Link
                      href="/request-part"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                    >
                      Start Your Request
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                {/* Visual */}
                <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                  <div className={`${step.color} border-2 rounded-2xl p-12 text-center`}>
                    <div className="flex justify-center mb-6">
                      {step.icon}
                    </div>
                    <h4 className="text-2xl font-bold text-gray-800 mb-4">Step {step.number}</h4>
                    <p className="text-lg text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Why Choose PartsFinda?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the advantages of Jamaica's premier car parts marketplace
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-lg p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">2,500+</div>
              <div className="text-blue-100">Parts Requested</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">150+</div>
              <div className="text-blue-100">Verified Suppliers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">98%</div>
              <div className="text-blue-100">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">24/7</div>
              <div className="text-blue-100">Platform Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Find Your Parts?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of satisfied customers who found exactly what they needed
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/request-part"
              className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Request Parts Now
            </Link>
            <Link
              href="/auth/register"
              className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
