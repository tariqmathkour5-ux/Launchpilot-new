import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'LaunchPilot Terms of Service — the rules and guidelines governing your use of our AI tools directory.',
};

export default function TermsPage() {
  const lastUpdated = 'July 1, 2026';

  return (
    <>
      <Header />
      <main className="py-12 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-secondary-900">Terms of Service</h1>
            <p className="text-secondary-500 mt-2">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-secondary max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-secondary-700 leading-relaxed">
                By accessing and using LaunchPilot (&quot;the Service&quot;), you accept and agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use our service. We reserve
                the right to update these terms at any time, and your continued use of the service constitutes
                acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">2. Use of the Service</h2>
              <p className="text-secondary-700 leading-relaxed mb-3">You agree to use LaunchPilot only for lawful purposes and in a way that does not:</p>
              <ul className="list-disc pl-6 space-y-2 text-secondary-700">
                <li>Infringe the rights of any third party</li>
                <li>Restrict or inhibit anyone else&apos;s use of the service</li>
                <li>Transmit any unsolicited or unauthorized advertising or promotional material</li>
                <li>Introduce any malware, viruses, or other harmful software</li>
                <li>Attempt to gain unauthorized access to any part of the service</li>
                <li>Scrape, crawl, or spider content without express written permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">3. Intellectual Property</h2>
              <p className="text-secondary-700 leading-relaxed">
                The service and its original content, features, and functionality are and will remain the
                exclusive property of LaunchPilot and its licensors. Our content may not be copied, reproduced,
                distributed, transmitted, broadcast, or otherwise exploited without our prior written consent.
                User-generated content remains owned by the respective users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">4. User Accounts</h2>
              <p className="text-secondary-700 leading-relaxed">
                If you create an account with us, you are responsible for maintaining the confidentiality of
                your account credentials and for all activities that occur under your account. You must
                immediately notify us of any unauthorized use of your account. We reserve the right to
                terminate accounts at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">5. Third-Party Tools and Links</h2>
              <p className="text-secondary-700 leading-relaxed">
                LaunchPilot is a directory and review platform for AI tools. We are not affiliated with, endorsed
                by, or responsible for any of the third-party tools listed on our platform unless explicitly
                stated. Our reviews represent our editorial opinion at the time of writing. Tool features,
                pricing, and availability are subject to change by their respective providers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">6. Disclaimer of Warranties</h2>
              <p className="text-secondary-700 leading-relaxed">
                The service is provided &quot;as is&quot; without warranties of any kind, either express or implied,
                including but not limited to implied warranties of merchantability, fitness for a particular
                purpose, or non-infringement. We do not warrant that the service will be uninterrupted,
                error-free, or completely secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-secondary-700 leading-relaxed">
                In no event shall LaunchPilot, its directors, employees, or agents be liable for any indirect,
                incidental, special, consequential, or punitive damages, including without limitation loss of
                profits, data, use, goodwill, or other intangible losses, resulting from your access to or use
                of (or inability to access or use) the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">8. Governing Law</h2>
              <p className="text-secondary-700 leading-relaxed">
                These Terms shall be governed and construed in accordance with applicable law, without regard to
                its conflict of law provisions. Any disputes arising under these terms shall be subject to the
                exclusive jurisdiction of the competent courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">9. Changes to Terms</h2>
              <p className="text-secondary-700 leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. We will provide notice of
                significant changes by updating the &quot;Last updated&quot; date. By continuing to access or use our
                service after those changes become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">10. Contact Us</h2>
              <p className="text-secondary-700 leading-relaxed">
                If you have any questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@launchpilot.ai" className="text-primary-600 hover:text-primary-700">
                  legal@launchpilot.ai
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
