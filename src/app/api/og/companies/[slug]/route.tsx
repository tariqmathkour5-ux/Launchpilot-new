import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    // Load company data
    const path = require('path');
    const fs = require('fs');
    const companiesPath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'companies.json');
    
    let company: any;
    try {
      if (fs.existsSync(companiesPath)) {
        const companies: any[] = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
        company = companies.find(c => c.slug === slug);
      }
    } catch (error) {
      console.error('Failed to load company:', error);
    }

    if (!company) {
      return new Response('Company not found', { status: 404 });
    }

    // Count tools for this company
    const { searchToolsKb } = await import('@/lib/tools-kb');
    const allTools = searchToolsKb({}).tools;
    const companyTools = allTools.filter(t => 
      company.tools?.includes(t.slug) ||
      t.website_url?.toLowerCase().includes(slug.replace(/-/g, '')) ||
      t.name.toLowerCase().includes(slug.replace(/-/g, ''))
    );

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '80px 60px',
          }}
        >
          {/* Company Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '120px',
              height: '120px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '30px',
              marginBottom: '40px',
            }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>

          {/* Industry Badge */}
          {company.industry && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '9999px',
                padding: '12px 24px',
                marginBottom: '30px',
              }}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '24px',
                  fontWeight: '600',
                }}
              >
                {company.industry}
              </span>
            </div>
          )}

          {/* Company Name */}
          <div
            style={{
              display: 'flex',
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: '30px',
              maxWidth: '1000px',
            }}
          >
            {company.name}
          </div>

          {/* Description */}
          {company.description && (
            <div
              style={{
                display: 'flex',
                fontSize: '28px',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                lineHeight: 1.5,
                marginBottom: '40px',
                maxWidth: '900px',
              }}
            >
              {company.description.length > 120 
                ? `${company.description.substring(0, 120)}...` 
                : company.description}
            </div>
          )}

          {/* Tools Count Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '16px 32px',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              {companyTools.length} {companyTools.length === 1 ? 'Tool' : 'Tools'}
            </div>
          </div>

          {/* LaunchPilot Branding */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              Powered by LaunchPilot
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}