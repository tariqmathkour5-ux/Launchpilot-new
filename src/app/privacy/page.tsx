import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'LaunchPilot Privacy Policy — how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  const lastUpdated = 'July 1, 2026';

  return (
    <>
      <Header />
      <main className="py-12 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-secondary-900">Privacy Policy</h1>
            <p className="text-secondary-500 mt-2">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-secondary max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">1. Introduction</h2>
              <p className="text-secondary-700 leading-relaxed">
                Welcome to LaunchPilot (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We are committed to protecting your personal
                information and your right to privacy. This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you visit our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">2. Information We Collect</h2>
              <p className="text-secondary-700 leading-relaxed mb-3">We collect information you provide directly to us, such as when you:</p>
              <ul className="list-disc pl-6 space-y-2 text-secondary-700">
                <li>Create an account or register on our platform</li>
                <li>Subscribe to our newsletter or updates</li>
                <li>Contact us via email or contact forms</li>
                <li>Interact with our content or services</li>
              </ul>
              <p className="text-secondary-700 leading-relaxed mt-4">
                This may include your name, email address, and any other information you choose to provide.
                We also automatically collect certain information when you visit our site, including IP address,
                browser type, pages viewed, and time spent on pages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-secondary-700 leading-relaxed mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 text-secondary-700">
                <li>Provide, maintain, and improve our services</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Send newsletters and marketing communications (with your consent)</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Protect against fraudulent, unauthorized, or illegal activity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">4. Cookies</h2>
              <p className="text-secondary-700 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our website and hold
                certain information. Cookies are files with a small amount of data which may include an
                anonymous unique identifier. You can instruct your browser to refuse all cookies or to
                indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">5. Data Sharing</h2>
              <p className="text-secondary-700 leading-relaxed">
                We do not sell, trade, or otherwise transfer your personally identifiable information to outside
                parties. This does not include trusted third parties who assist us in operating our website,
                conducting our business, or serving you, as long as those parties agree to keep this information
                confidential. We may also release your information when we believe release is appropriate to
                comply with the law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">6. Data Security</h2>
              <p className="text-secondary-700 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect the security
                of your personal information. However, please be aware that no security measures are perfect or
                impenetrable, and we cannot guarantee the absolute security of your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">7. Your Rights</h2>
              <p className="text-secondary-700 leading-relaxed mb-3">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-secondary-700">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">8. Third-Party Links</h2>
              <p className="text-secondary-700 leading-relaxed">
                Our website may contain links to third-party websites. We have no control over the content or
                privacy practices of those sites and are not responsible for their privacy policies. We encourage
                you to review the privacy policy of any site you visit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-secondary-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by
                posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. Your continued
                use of our services after any changes constitutes your acceptance of the new policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">10. Contact Us</h2>
              <p className="text-secondary-700 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@launchpilot.ai" className="text-primary-600 hover:text-primary-700">
                  privacy@launchpilot.ai
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
