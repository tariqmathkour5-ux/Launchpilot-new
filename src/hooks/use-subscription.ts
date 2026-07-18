import { useEffect, useState } from 'react';
import { getUserPlanSlug, checkFeatureAccess } from '@/lib/subscriptions';

interface UseSubscriptionOptions {
  requiredFeature?: string;
}

interface SubscriptionState {
  planSlug: string;
  hasFeatureAccess: boolean;
  loading: boolean;
}

export function useSubscription(options: UseSubscriptionOptions = {}): SubscriptionState {
  const [planSlug, setPlanSlug] = useState<string>('free');
  const [hasFeatureAccess, setHasFeatureAccess] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        // Get current subscription status from API
        const response = await fetch('/api/subscriptions/current');
        const data = await response.json();
        
        if (data.plan?.slug) {
          setPlanSlug(data.plan.slug);
          
          if (options.requiredFeature) {
            // Check feature access through the API
            const featureResponse = await fetch(`/api/subscriptions/check-feature?feature=${options.requiredFeature}`);
            const featureData = await featureResponse.json();
            setHasFeatureAccess(featureData.hasAccess);
          } else {
            setHasFeatureAccess(true);
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [options.requiredFeature]);

  return { planSlug, hasFeatureAccess, loading };
}