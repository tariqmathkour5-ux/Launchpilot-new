"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Clock, Zap, Gift, ExternalLink, ShoppingCart, Check } from "lucide-react";
import { useExitIntent } from "@/hooks/use-exit-intent";

interface ConversionModalProps {
  toolName?: string;
  toolSlug?: string;
  discount?: string;
  endTime?: Date;
  onOpenChange?: (open: boolean) => void;
  enabled?: boolean;
}

// Default offer configuration
const DEFAULT_OFFER = {
  title: "Limited Time Offer!",
  description: "Get exclusive access to premium AI tools at discounted rates",
  discount: "25% OFF",
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  cta: "Claim Your Discount",
};

/**
 * Smart Conversion Modal with Exit Intent and Countdown Timer
 * 
 * Features:
 * - Exit intent detection (mouse leaving viewport)
 * - Countdown timer for urgency
 * - Session storage to prevent repeated popups
 * - Fully customizable via props
 */
export default function ConversionModal({
  toolName,
  toolSlug,
  discount = DEFAULT_OFFER.discount,
  endTime = DEFAULT_OFFER.endTime,
  onOpenChange,
  enabled = true,
}: ConversionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  // Use the exit intent hook
  const { showModal: showFromExitIntent, triggerType, setShowModal: setShowFromExitIntent } = useExitIntent({
    enabled,
  });

  // Sync exit intent state with local state
  useEffect(() => {
    if (showFromExitIntent) {
      setIsOpen(true);
      onOpenChange?.(true);
    }
  }, [showFromExitIntent, onOpenChange]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isOpen, endTime]);

  // Handle close with sessionStorage
  const handleClose = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  // Handle manual trigger
  const triggerManually = useCallback(() => {
    setShowFromExitIntent(true);
  }, [setShowFromExitIntent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 mx-auto mb-4">
            <Gift className="h-8 w-8" />
          </div>

          {/* Title */}
          <h2 id="modal-title" className="text-2xl font-bold text-secondary-900 mb-2">
            {DEFAULT_OFFER.title}
          </h2>

          {/* Discount badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-500/10 text-success-600 font-bold text-lg mb-4">
            <Zap className="h-5 w-5" />
            {discount}
          </div>

          {/* Description */}
          <p className="text-secondary-600 mb-6">
            {toolName
              ? `Get ${toolName} at special pricing before the offer expires!`
              : DEFAULT_OFFER.description}
          </p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-warning-500" />
            <span className="text-sm font-medium text-secondary-500">Offer ends in:</span>
          </div>

          <div className="flex justify-center gap-3 mb-6">
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <TimeUnit value={timeLeft.minutes} label="Minutes" />
            <TimeUnit value={timeLeft.seconds} label="Seconds" />
          </div>

          {/* CTA Button */}
          <a
            href={toolSlug ? `/tools/${toolSlug}` : "/pricing"}
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            onClick={handleClose}
          >
            {DEFAULT_OFFER.cta}
            <ExternalLink className="h-4 w-4" />
          </a>

          {/* Disclaimer */}
          <p className="text-xs text-secondary-400 mt-4">
            Limited spots available. Offer valid for 24 hours only.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper component for time unit display
function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="bg-secondary-100 rounded-lg px-3 py-2 min-w-16">
        <span className="text-2xl font-bold text-secondary-900">
          {value.toString().padStart(2, "0")}
        </span>
        <p className="text-xs text-secondary-500">{label}</p>
      </div>
    </div>
  );
}

// Hook for managing exit intent timing and display (kept for backwards compatibility)
interface UseExitIntentOldProps {
  onOpenChange?: (open: boolean) => void;
}

export function useExitIntentOld({ onOpenChange }: UseExitIntentOldProps = {}) {
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
        onOpenChange?.(true);
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
  }, [onOpenChange]);

  return { showModal, setShowModal };
}

// Export the new hook for direct use
export { useExitIntent };