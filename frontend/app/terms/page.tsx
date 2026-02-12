'use client';

import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{ backgroundColor: 'var(--background)' }}>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div 
          className="border rounded-xl shadow-lg p-8 md:p-12 transition-colors"
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--border-color)' 
          }}
        >
          <h1 
            className="text-3xl md:text-4xl font-bold mb-6 transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            Terms and Conditions
          </h1>
          
          <div 
            className="text-sm mb-4 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Last updated: {new Date().toLocaleDateString()}
          </div>

          <div 
            className="prose prose-sm max-w-none space-y-6 transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            <section>
              <h2 
                className="text-xl font-semibold mb-3 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                1. Acceptance of Terms
              </h2>
              <p 
                className="mb-4 leading-relaxed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 
                className="text-xl font-semibold mb-3 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                2. Product Information
              </h2>
              <p 
                className="mb-4 leading-relaxed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                We offer custom labeled 500ml bottles filled with re-filtered and re-mineralized PH Emerald Water. 
                All products are packaged in cases of 30 bottles. Our minimum order quantity is 10 cases (300 bottles).
              </p>
            </section>

            <section>
              <h2 
                className="text-xl font-semibold mb-3 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                3. Pricing and Payment
              </h2>
              <p 
                className="mb-4 leading-relaxed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Pricing is subject to change without notice. All prices are in USD and subject to applicable taxes. 
                Deposit and environmental fees are included in the pricing. A one-time setup fee of $150 applies for 
                design and color of your logo. Payment terms will be specified at checkout.
              </p>
            </section>

            <section>
              <h2 
                className="text-xl font-semibold mb-3 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                4. Order Process
              </h2>
              <p 
                className="mb-4 leading-relaxed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Orders are processed after payment confirmation. You will receive an order confirmation via email. 
                All customization, preparation, and packaging is done in-house. Production timeframes will be communicated 
                upon order confirmation.
              </p>
            </section>

            <section>
              <h2 
                className="text-xl font-semibold mb-3 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                5. Shipping and Delivery
              </h2>
              <p 
                className="mb-4 leading-relaxed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Pick-up is free of charge. Local scheduled delivery is available for $50. Shipping quotes are available 
                for orders outside Regina. Delivery times will vary based on location and shipping method selected.
              </p>
            </section>

            <section>
              <h2 
                className="text-xl font-semibold mb-3 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                6. Design and Customization
              </h2>
              <p 
                className="mb-4 leading-relaxed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                You are responsible for ensuring all designs, images, and text comply with applicable laws and do not 
                infringe on any third-party rights. We reserve the right to refuse any design that we deem inappropriate, 
                illegal, or in violation of our policies.
              </p>
            </section>

            <section>
              <h2 
                className="text-xl font-semibold mb-3 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                7. Cancellations and Refunds
              </h2>
              <p 
                className="mb-4 leading-relaxed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancellations must be made within 24 hours of order placement for a full refund. Once production has 
                begun, cancellations may not be possible, and refunds will be at our discretion. Custom designs are 
                non-refundable once production has started.
              </p>
            </section>

            <section>
              <h2 
                className="text-xl font-semibold mb-3 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                8. Limitation of Liability
              </h2>
              <p 
                className="mb-4 leading-relaxed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Our liability is limited to the value of the products ordered. We are not liable for any indirect, 
                incidental, or consequential damages arising from the use of our products or services.
              </p>
            </section>

            <section>
              <h2 
                className="text-xl font-semibold mb-3 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                9. Contact Information
              </h2>
              <p 
                className="mb-4 leading-relaxed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                For questions about these Terms and Conditions, please contact us through our website at{' '}
                <a 
                  href="https://www.emeraldwater.ca" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-[#4DB64F] transition-colors"
                  style={{ color: '#4DB64F' }}
                >
                  emeraldwater.ca
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
















