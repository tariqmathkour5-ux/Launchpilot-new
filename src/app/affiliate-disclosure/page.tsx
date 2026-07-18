import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description: 'LaunchPilot Affiliate Disclosure — transparency about our commercial relationships and how we earn revenue.',
};

export default function AffiliateDisclosurePage() {
  const lastUpdated = 'July 1, 2026';

  return (
    <>
      <Header />
      <main className="py-12 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-secondary-900">Affiliate Disclosure</h1>
            <p className="text-secondary-500 mt-2">Last updated: {lastUpdated}</p>
          </div>

          <div className="mb-8 p-6 rounded-xl bg-primary-50 border border-primary-200">
            <p className="text-primary-800 font-medium">
              In the interest of full transparency, LaunchPilot discloses its commercial relationships
              with the companies and products featured on this site.
            </p>
          </div>

          <div className="prose prose-secondary max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">Our Commitment to Transparency</h2>
              <p className="text-secondary-700 leading-relaxed">
                LaunchPilot is an independent AI tools directory and review platform. We are committed to
                providing honest, unbiased, and accurate information to help you make informed decisions
                about the AI tools you use. This disclosure page explains how our website earns revenue
                and how that may affect our content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">Affiliate Relationships</h2>
              <p className="text-secondary-700 leading-relaxed">
                Some of the links on LaunchPilot are affiliate links. This means that if you click on
                a link and subsequently make a purchase or sign up for a service, we may receive a
                commission at no additional cost to you. This helps us continue to operate and maintain
                this free resource.
              </p>
              <p className="text-secondary-700 leading-relaxed mt-4">
                We participate in affiliate programs with various AI tool providers. When a tool listing
                or review page contains an affiliate link, it will direct you to the third-party website
                where you can make a purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">How This Affects Our Reviews</h2>
              <p className="text-secondary-700 leading-relaxed">
                Our editorial independence is paramount. Having an affiliate relationship with a company
                does not influence our editorial ratings, rankings, or content. We:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-secondary-700 mt-4">
                <li>Evaluate tools based on their actual features, performance, and value</li>
                <li>Include both pros and cons in every review, regardless of affiliate status</li>
                <li>Feature non-affiliate tools when they are the best option for users</li>
                <li>Maintain consistent evaluation criteria across all tools in a category</li>
                <li>Never accept payment for positive reviews or rankings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">Sponsored Content</h2>
              <p className="text-secondary-700 leading-relaxed">
                Occasionally, we may publish sponsored content — articles or reviews that are paid for
                by a company. Any sponsored content will be clearly labeled as &quot;Sponsored&quot; or
                &quot;Paid Partnership&quot; at the top of the page. Sponsored content represents the views
                of the sponsor and may not represent the views of LaunchPilot.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">Free Tools and Trial Access</h2>
              <p className="text-secondary-700 leading-relaxed">
                In some cases, tool providers may offer us free access to their products for review
                purposes. Receiving free access does not guarantee a positive review. We evaluate all
                tools using the same criteria, whether we paid for access or received it complimentarily.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">FTC Compliance</h2>
              <p className="text-secondary-700 leading-relaxed">
                This disclosure is made in compliance with the Federal Trade Commission&apos;s (FTC) guidelines
                on endorsements and testimonials in advertising (16 CFR Part 255) and the FTC&apos;s Guides
                Concerning the Use of Endorsements and Testimonials in Advertising. We believe in
                transparency and want you to know about any financial relationships that may influence
                our content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">Contact Us</h2>
              <p className="text-secondary-700 leading-relaxed">
                If you have questions about our affiliate relationships or editorial policies, please
                contact us at{' '}
                <a href="mailto:editorial@launchpilot.ai" className="text-primary-600 hover:text-primary-700">
                  editorial@launchpilot.ai
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
