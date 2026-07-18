import Link from 'next/link';
import { ArrowLeft, Building2, ExternalLink } from 'lucide-react';
import { searchToolsKb } from '@/lib/tools-kb';
import { generateCompanySeoMetadata, generateCompanyJsonLd } from '@/lib/tools-seo-pages';

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  try {
    const path = require('path');
    const fs = require('fs');
    const companiesPath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'companies.json');
    
    if (fs.existsSync(companiesPath)) {
      const companies: Company[] = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
      return companies.map((company) => ({ slug: company.slug }));
    }
  } catch (error) {
    console.error('Failed to load company slugs:', error);
  }
  
  return [];
}

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
}

interface Company {
  id: string;
  slug: string;
  name: string;
  description: string;
  industry: string;
  founded?: number;
  headquarters?: string;
  website?: string;
  tools: string[];
}

export async function generateMetadata({ params }: CompanyPageProps) {
  const { slug } = await params;
  
  // Load company data
  const path = require('path');
  const fs = require('fs');
  const companiesPath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'companies.json');
  
  let company: Company | undefined;
  try {
    if (fs.existsSync(companiesPath)) {
      const companies: Company[] = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
      company = companies.find(c => c.slug === slug);
    }
  } catch (error) {
    console.error('Failed to load company:', error);
  }
  
  if (!company) {
    return {
      title: 'Company Not Found - LaunchPilot',
      description: 'Company details not available.',
    };
  }
  
  const metadata = generateCompanySeoMetadata(company);
  
  // Add dynamic OG image
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [
        {
          url: `/api/og/companies/${slug}`,
          alt: `${company.name} - Company Profile`,
        },
      ],
    },
    twitter: {
      ...metadata.twitter,
      images: [`/api/og/companies/${slug}`],
    },
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  
  // Load company data
  const path = require('path');
  const fs = require('fs');
  const companiesPath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'companies.json');
  
  let company: Company | undefined;
  try {
    if (fs.existsSync(companiesPath)) {
      const companies: Company[] = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
      company = companies.find(c => c.slug === slug);
    }
  } catch (error) {
    console.error('Failed to load company:', error);
  }
  
  // Get tools from this company
  const allTools = searchToolsKb({}).tools;
  const companyTools = company 
    ? allTools.filter(t => company!.tools.includes(t.slug))
    : allTools.filter(t => 
        t.website_url?.toLowerCase().includes(slug.replace(/-/g, '')) ||
        t.name.toLowerCase().includes(slug.replace(/-/g, ''))
      );

  if (!company) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="card p-12 text-center">
          <Building2 className="h-12 w-12 text-secondary-300 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Company Not Found</h2>
          <p className="text-secondary-600 mb-4">Could not find company with slug: {slug}</p>
          <Link href="/tools" className="btn btn-primary">
            Browse All Tools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-secondary-900">{company.name}</h1>
          </div>
          <p className="text-secondary-600 max-w-3xl">{company.description}</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Company Info */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {company.industry && (
              <div>
                <span className="text-sm font-medium text-secondary-500 uppercase">Industry</span>
                <p className="text-secondary-900 mt-1">{company.industry}</p>
              </div>
            )}
            {company.founded && (
              <div>
                <span className="text-sm font-medium text-secondary-500 uppercase">Founded</span>
                <p className="text-secondary-900 mt-1">{company.founded}</p>
              </div>
            )}
            {company.headquarters && (
              <div>
                <span className="text-sm font-medium text-secondary-500 uppercase">Headquarters</span>
                <p className="text-secondary-900 mt-1">{company.headquarters}</p>
              </div>
            )}
          </div>
          {company.website && (
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Company Website
              </a>
            </div>
          )}
        </div>

        {/* Tools from this Company */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-secondary-900 mb-4">
            Tools by {company.name} ({companyTools.length})
          </h2>
          
          {companyTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companyTools.map(tool => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="card p-6 block hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">{tool.name}</h3>
                  <p className="text-sm text-secondary-600 line-clamp-2 mb-4">{tool.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${tool.pricing === 'freemium' || tool.pricing === 'free' ? 'badge-success' : 'badge-warning'}`}>
                      {tool.pricing}
                    </span>
                    {tool.has_api && (
                      <span className="badge badge-primary">API</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-6 text-center">
              <p className="text-secondary-600">No tools found for this company.</p>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div>
          <Link href="/tools" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
}