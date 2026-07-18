# Smart Conversion System

A comprehensive system for increasing conversion rates through exit-intent popups and strategically placed affiliate buttons.

## Components

### 1. ConversionModal (`src/components/ConversionModal.tsx`)
A modal component that triggers on exit intent (mouse leaving viewport to top) with a countdown timer.

**Features:**
- Exit intent detection (mouseleave event on document)
- Countdown timer displaying hours, minutes, and seconds
- Session storage to prevent repeated popups on the same session
- Fully customizable via props
- Accessible with proper ARIA attributes

**Props:**
- `toolName?: string` - Name of the tool for personalization
- `toolSlug?: string` - Slug for linking to tool page
- `discount?: string` - Discount text (default: "25% OFF")
- `endTime?: Date` - Countdown end time (default: 24 hours from now)
- `onOpenChange?: (open: boolean) => void` - Callback when modal opens/closes
- `enabled?: boolean` - Enable/disable the exit intent detection

### 2. AffiliateButton (`src/components/AffiliateButton.tsx`)
A high-converting affiliate button component for tool comparison articles.

**Features:**
- Three position styles: top, middle, bottom
- Commission badge display
- External link with security attributes
- Hover animations for engagement
- Data attribute for tracking (`data-conversion-button`)

**Props:**
- `toolName: string` - Name of the tool
- `toolSlug: string` - Slug for the tool
- `websiteUrl?: string` - Affiliate link URL
- `commission?: string` - Commission text (e.g., "Up to 30% commission")
- `position?: "top" | "middle" | "bottom"` - Button style position

### 3. injectAffiliateButtons (`src/components/AffiliateButton.tsx`)
Utility function to inject affiliate buttons into markdown content.

**Usage:**
```tsx
import { injectAffiliateButtons } from '@/components/AffiliateButton';

const elements = injectAffiliateButtons({
  content: markdownContent,
  toolName: "ChatGPT",
  toolSlug: "chatgpt",
  websiteUrl: "https://example.com",
  insertAfterParagraph: 2, // Optional: insert after 2nd paragraph
});
```

### 4. injectAffiliateIntoComparisonArticle (`src/components/AffiliateButton.tsx`)
Utility to inject affiliate buttons into tool comparison articles at strategic positions.

**Positions:**
- `after_intro` - After the first paragraph
- `before_conclusion` - Before the conclusion/summary section
- `after_paragraph` - After a specific paragraph index

**Usage:**
```tsx
import { injectAffiliateIntoComparisonArticle } from '@/components/AffiliateButton';

const { content } = injectAffiliateIntoComparisonArticle(
  {
    title: "ChatGPT vs Claude",
    content: articleMarkdown,
    toolSlug: "chatgpt",
    toolName: "ChatGPT",
    websiteUrl: "https://chat.openai.com",
  },
  {
    discount: "30% OFF",
    position: "after_intro",
  }
);
```

### 5. SmartConversionProvider (`src/components/SmartConversionProvider.tsx`)
A wrapper component that easily integrates the conversion modal into any page.

**Usage:**
```tsx
import { SmartConversionProvider } from '@/components/SmartConversionProvider';

function Page() {
  return (
    <SmartConversionProvider
      toolName="ChatGPT"
      toolSlug="chatgpt"
      discount="30% OFF"
    >
      <YourPageContent />
    </SmartConversionProvider>
  );
}
```

### 6. useExitIntent Hook (`src/hooks/use-exit-intent.ts`)
A reusable hook for detecting exit intent.

**Usage:**
```tsx
import { useExitIntent } from '@/hooks/use-exit-intent';

function Component() {
  const { showModal, triggerType, setShowModal, resetStorage } = useExitIntent({
    enabled: true,
    delayMs: 10000, // Wait 10 seconds before listening
  });

  // ... use showModal state to display your modal
}
```

## Integration

The Smart Conversion System is integrated into the tool pages. The `ConversionModal` is placed at the bottom of each tool page (`src/app/tools/[slug]/page.tsx`) and will automatically trigger when users attempt to leave the page.

## Utilities Library (`src/lib/conversion.ts`)
A centralized export file providing all conversion utilities:

```tsx
import {
  AffiliateButton,
  ConversionModal,
  useExitIntent,
  SmartConversionProvider,
  injectAffiliateButtons,
  injectAffiliateIntoComparisonArticle,
  getEndTimeFromNow,
  calculateTimeLeft,
  formatTimeUnit,
} from '@/lib/conversion';
```

## Technical Details

### Exit Intent Detection
- Listens for `mouseleave` events on the document
- Triggers when `e.clientY <= 0` (mouse leaves through top)
- Starts listening after a configurable delay (default: 10 seconds)
- Prevents multiple triggers with session storage

### Countdown Timer
- Updates every second
- Shows time remaining in hours, minutes, and seconds
- Pauses when modal is closed
- Automatically stops at 00:00:00

### Session Storage
- Uses `exitIntentSeen` key by default
- Can be configured via `sessionStorageKey` option
- Allows resetStorage() for testing purposes