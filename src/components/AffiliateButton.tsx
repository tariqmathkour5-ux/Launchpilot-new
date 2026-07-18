"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, ExternalLink, Check, Zap } from "lucide-react";
import { trackAffiliateClick } from "@/lib/analytics";

interface AffiliateButtonProps {
  toolName: string;
  toolSlug: string;
  websiteUrl?: string;
  commission?: string; // e.g., "Up to 30% commission"
  position?: "top" | "middle" | "bottom";
}

// High-converting affiliate button component
export function AffiliateButton({
  toolName,
  toolSlug,
  websiteUrl = "#",
  commission,
  position = "middle",
}: AffiliateButtonProps) {
  const buttonStyles = {
    top: "bg-gradient-to-r from-success-600 to-success-500 hover:from-success-700 hover:to-success-600",
    middle: "bg-primary-600 hover:bg-primary-700",
    bottom: "bg-gradient-to-r from-accent-600 to-primary-600 hover:from-accent-700 hover:to-primary-700",
  };

  return (
    <div className="my-8 p-6 rounded-xl border border-secondary-200 bg-gradient-to-r from-secondary-50 to-primary-50/30" data-conversion-button>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-warning-500" />
            <h3 className="text-lg font-bold text-secondary-900">Ready to try {toolName}?</h3>
          </div>
          <p className="text-sm text-secondary-600 mb-3">
            Get instant access to {toolName} - one of the leading AI tools in its category.
          </p>
          {commission && (
            <div className="flex items-center gap-2 text-sm text-success-600">
              <Check className="h-4 w-4" />
              <span>{commission}</span>
            </div>
          )}
        </div>

        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAffiliateClick(toolSlug, 'affiliate_button', toolSlug)}
          className={`inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${buttonStyles[position]}`}
        >
          <ShoppingCart className="h-5 w-5" />
          Buy Now
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

// Utility function to inject affiliate buttons into markdown content
interface InjectAffiliateButtonsProps {
  content: string;
  toolName: string;
  toolSlug: string;
  websiteUrl?: string;
  commission?: string;
  insertAfterParagraph?: number;
}

export function injectAffiliateButtons({
  content,
  toolName,
  toolSlug,
  websiteUrl,
  commission,
  insertAfterParagraph,
}: InjectAffiliateButtonsProps): React.ReactNode[] {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let paragraphCount = 0;
  let affiliateInjected = false;

  const targetParagraph = insertAfterParagraph ?? Math.max(1, Math.floor(lines.filter((l) => l.trim()).length / 3));

  lines.forEach((line, index) => {
    if (!line.trim()) return;

    if (!line.startsWith("#") && !line.startsWith("-") && !line.startsWith("*") && !line.startsWith("|")) {
      if (line.trim().length > 50) {
        paragraphCount++;
      }
    }

    if (paragraphCount === targetParagraph && !affiliateInjected && line.trim()) {
      elements.push(
        <p key={`p-${index}`} className="text-secondary-700 mb-4">
          {line.trim()}
        </p>
      );

      elements.push(
        <AffiliateButton
          key="affiliate-injected"
          toolName={toolName}
          toolSlug={toolSlug}
          websiteUrl={websiteUrl}
          commission={commission}
        />
      );

      affiliateInjected = true;
      return;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-2xl font-bold text-secondary-900 mt-8 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-xl font-semibold text-secondary-900 mt-6 mb-3">
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      // This is handled by the parent component typically
    } else if (line.trim()) {
      elements.push(
        <p key={`p-${index}`} className="text-secondary-700 mb-4">
          {line.trim()}
        </p>
      );
    }
  });

  return elements;
}

// Enhanced hook for managing exit intent timing and display
export function useExitIntent_old() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const hasSeenOffer = sessionStorage.getItem("exitIntentSeen");
    if (hasSeenOffer) return;

    let exitIntentTriggered = false;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentTriggered) {
        exitIntentTriggered = true;
        setShowModal(true);
        sessionStorage.setItem("exitIntentSeen", "true");
      }
    };

    const timer = setTimeout(() => {
      if (!exitIntentTriggered) {
        document.addEventListener("mouseleave", handleMouseLeave);
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return { showModal, setShowModal };
}

// Utility to inject affiliate buttons into tool comparison articles
export interface ToolComparisonArticle {
  title: string;
  content: string;
  toolSlug: string;
  toolName: string;
  websiteUrl?: string;
}

export function injectAffiliateIntoComparisonArticle(
  article: ToolComparisonArticle,
  options?: {
    discount?: string;
    countdownHours?: number;
    position?: "after_intro" | "before_conclusion" | "after_paragraph";
    paragraphIndex?: number;
  }
): {
  content: React.ReactNode[];
  injectedButtonText?: string;
} {
  const { content, toolName, toolSlug, websiteUrl } = article;
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let injected = false;

  const comparisonIndex = lines.findIndex((l) =>
    l.toLowerCase().includes("comparison") ||
    l.toLowerCase().includes("versus") ||
    l.toLowerCase().includes("vs.")
  );

  const conclusionIndex = lines.findIndex((l) =>
    l.toLowerCase().includes("conclusion") ||
    l.toLowerCase().includes("summary") ||
    l.toLowerCase().includes("final thoughts")
  );

  const injectPosition = options?.position ?? "after_intro";
  let insertIndex: number | null = null;

  switch (injectPosition) {
    case "after_intro":
      insertIndex = lines.findIndex((l, i) => i > 0 && l.trim().length > 50 && !l.startsWith("#"));
      break;
    case "before_conclusion":
      if (conclusionIndex > 0) {
        insertIndex = Math.max(0, conclusionIndex - 1);
      }
      break;
    case "after_paragraph":
      if (options?.paragraphIndex !== undefined) {
        const targetParaIndex = options.paragraphIndex;
        let paraCount = 0;
        insertIndex = lines.findIndex((l) => {
          if (l.trim().length > 50 && !l.startsWith("#") && !l.startsWith("-")) {
            return ++paraCount > targetParaIndex;
          }
          return false;
        });
      }
      break;
  }

  lines.forEach((line, index) => {
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-2xl font-bold text-secondary-900 mt-8 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-xl font-semibold text-secondary-900 mt-6 mb-3">
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.trim() && !line.startsWith("-") && !line.startsWith("*") && !line.startsWith("|")) {
      if (!injected && insertIndex !== null && index === insertIndex) {
        elements.push(
          <AffiliateButton
            key="affiliate-comparison"
            toolName={toolName}
            toolSlug={toolSlug}
            websiteUrl={websiteUrl}
            commission={options?.discount ? `Special offer: ${options.discount} off` : undefined}
            position="middle"
          />
        );
        injected = true;
      }

      elements.push(
        <p key={`p-${index}`} className="text-secondary-700 mb-4">
          {line.trim()}
        </p>
      );
    }
  });

  if (!injected) {
    elements.push(
      <AffiliateButton
        key="affiliate-comparison-end"
        toolName={toolName}
        toolSlug={toolSlug}
        websiteUrl={websiteUrl}
        commission={options?.discount ? `Special offer: ${options.discount} off` : undefined}
        position="bottom"
      />
    );
  }

  return {
    content: elements,
    injectedButtonText: injected ? "Buy Now with Special Offer" : undefined,
  };
}