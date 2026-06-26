import { Sparkles } from "lucide-react";
import { useDailyQuote } from "../hooks/useDailyQuote";

export const QuoteBanner = () => {
  const quote = useDailyQuote();
  return (
    <div
      data-testid="quote-banner"
      className="relative rounded-2xl p-4 md:p-5 mb-6 slide-up"
      style={{
        background:
          "linear-gradient(135deg, rgba(255, 138, 61, 0.18) 0%, rgba(255, 45, 146, 0.18) 100%)",
        border: "1px solid rgba(255, 210, 74, 0.45)",
        boxShadow: "0 0 24px rgba(255, 138, 61, 0.18) inset",
      }}
    >
      <div className="flex items-start gap-3">
        <Sparkles className="text-[var(--yellow)] mt-0.5 flex-shrink-0" size={20} strokeWidth={2.5} />
        <div className="flex-1 min-w-0">
          <p className="font-display text-base md:text-lg leading-snug text-[var(--yellow)]" data-testid="quote-text">
            "{quote.text}"
          </p>
          <p className="text-sm mt-1 opacity-80" data-testid="quote-author">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
};
