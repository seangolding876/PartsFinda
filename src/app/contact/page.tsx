'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

// ✅ Sanitization function - XSS attacks se bachane ke liye
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;');
};

// ✅ Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ✅ Phone validation
const isValidPhone = (phone: string): boolean => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\d\s\-()+]+$/;
  return phoneRegex.test(phone);
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  // ✅ Client-side validation
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phone && !isValidPhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Subject validation
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters';
    } else if (formData.subject.trim().length > 200) {
      errors.subject = 'Subject must be less than 200 characters';
    }

    // Message validation
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    } else if (formData.message.trim().length > 2000) {
      errors.message = 'Message must be less than 2000 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // ✅ Client-side validation first
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Sanitize data before sending to API
      const sanitizedData = {
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email).toLowerCase(),
        phone: formData.phone ? sanitizeInput(formData.phone) : null,
        subject: sanitizeInput(formData.subject),
        message: sanitizeInput(formData.message),
        type: formData.type // Select option, already safe
      };

      console.log('Sending sanitized data:', sanitizedData);

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit form');
      }

      console.log('Contact form submitted successfully:', result);
      setSubmitted(true);
      
      // ✅ Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        type: 'general'
      });

    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // ✅ Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ Real-time validation for better UX
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const errors: {[key: string]: string} = {};

    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters';
        }
        break;
      
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!isValidEmail(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
      
      case 'phone':
        if (value && !isValidPhone(value)) {
          errors.phone = 'Please enter a valid phone number';
        }
        break;
      
      case 'subject':
        if (!value.trim()) {
          errors.subject = 'Subject is required';
        } else if (value.trim().length < 5) {
          errors.subject = 'Subject must be at least 5 characters';
        }
        break;
      
      case 'message':
        if (!value.trim()) {
          errors.message = 'Message is required';
        } else if (value.trim().length < 10) {
          errors.message = 'Message must be at least 10 characters';
        }
        break;
    }

    if (errors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: errors[name]
      }));
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">Message Sent!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for contacting us. We'll get back to you within 24 hours.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl">We're here to help you find the right auto parts</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Phone</h3>
                  <p className="text-gray-600">Call us for immediate assistance</p>
                  <a 
                    href="tel:1-876-219-3329" 
                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    1-876-219-3329
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Email</h3>
                  <p className="text-gray-600">Send us a message anytime</p>
                  <a 
                    href="mailto:support@partsfinda.com" 
                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    support@partsfinda.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Location</h3>
                  <p className="text-gray-600">Serving all of Jamaica</p>
                  <p className="text-gray-800 font-semibold">Kingston, Jamaica</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Business Hours</h3>
                  <div className="text-gray-600 space-y-1">
                    <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                    <p>Saturday: 9:00 AM - 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a
                  href="/request-part"
                  className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 text-center transition-colors"
                >
                  Request a Part
                </a>
                <a
                  href="/auth/seller-register"
                  className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 text-center transition-colors"
                >
                  Become a Seller
                </a>
                <a
                  href="/marketplace"
                  className="block w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 text-center transition-colors"
                >
                  Browse Parts
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                    minLength={2}
                    maxLength={100}
                  />
                  {fieldErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="876-XXX-XXXX"
                    pattern="[\d\s\-()+]+"
                    title="Please enter a valid phone number"
                  />
                  {fieldErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="parts">Parts Question</option>
                    <option value="seller">Seller Support</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Brief subject of your message"
                  minLength={5}
                  maxLength={200}
                />
                {fieldErrors.subject && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.subject}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tell us how we can help you..."
                  minLength={10}
                  maxLength={2000}
                />
                {fieldErrors.message && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.message}</p>
                )}
                <div className="text-right text-sm text-gray-500 mt-1">
                  {formData.message.length}/2000 characters
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section - Same as before */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-3">How do I request a part?</h3>
              <p className="text-gray-600">
                Simply visit our "Request a Part" page, fill out the form with your vehicle details and part requirements, and our network of sellers will provide you with quotes.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-3">How do I become a seller?</h3>
              <p className="text-gray-600">
                Click "Become a Seller" and fill out the registration form. We'll verify your business and you can start listing parts immediately.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-3">Is there a fee to use PartsFinda?</h3>
              <p className="text-gray-600">
                Browsing and requesting parts is free for buyers. Sellers have different subscription plans with various features and benefits.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-3">How do payments work?</h3>
              <p className="text-gray-600">
                Buyers and sellers arrange payment and shipping directly. We provide the platform to connect you with trusted sellers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}