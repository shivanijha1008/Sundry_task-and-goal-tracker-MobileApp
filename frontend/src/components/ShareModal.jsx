import { useState } from "react";
import { X, MessageCircle, Send, Mail, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

const buildText = (task, list) => {
  if (task) {
    const lines = [
      `📌 ${task.title}`,
      task.description ? task.description : null,
      task.due_time ? `⏰ ${task.due_time}` : null,
      `⌛ ${task.estimated_minutes}m`,
      `🔥 ${task.priority.toUpperCase()}`,
    ].filter(Boolean);
    return lines.join("\n");
  }
  if (list?.length) {
    return ["📝 My List:", ...list.map((i, idx) => `${idx + 1}. ${i}`)].join("\n");
  }
  return "";
};

export const ShareModal = ({ open, onClose, task, list, title }) => {
  const [text] = useState(() => buildText(task, list));
  if (!open) return null;

  const enc = encodeURIComponent(text);
  const targets = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#25D366", url: `https://wa.me/?text=${enc}` },
    { id: "telegram", label: "Telegram", icon: Send, color: "#26A5E4", url: `https://t.me/share/url?url=&text=${enc}` },
    { id: "sms", label: "SMS", icon: MessageCircle, color: "#FF8A3D", url: `sms:?&body=${enc}` },
    { id: "email", label: "Email", icon: Mail, color: "#B026FF", url: `mailto:?subject=${encodeURIComponent(title || "My task")}&body=${enc}` },
  ];

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || "Task", text });
      } catch {
        /* dismissed */
      }
    } else toast.error("Native share not available on this device");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        data-testid="share-modal"
        className="glass-hi w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl gradient-text-warm">Share</h2>
          <button data-testid="share-close-btn" onClick={onClose} className="w-9 h-9 rounded-full glass flex items-center justify-center" aria-label="Close">
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>
        <pre className="glass p-3 text-sm whitespace-pre-wrap mb-4 font-sans">{text}</pre>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {targets.map((t) => {
            const I = t.icon;
            return (
              <a
                key={t.id}
                data-testid={`share-${t.id}-btn`}
                href={t.url}
                target="_blank"
                rel="noreferrer"
                className="glass flex flex-col items-center gap-1 p-3 rounded-2xl lift"
              >
                <I size={20} strokeWidth={2.5} style={{ color: t.color }} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
              </a>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button data-testid="share-native-btn" onClick={nativeShare} className="btn-pill btn-ghost flex-1 inline-flex items-center justify-center gap-1">
            <Share2 size={14} strokeWidth={3} /> More apps
          </button>
          <button data-testid="share-copy-btn" onClick={copy} className="btn-pill btn-pink flex-1 inline-flex items-center justify-center gap-1">
            <Copy size={14} strokeWidth={3} /> Copy
          </button>
        </div>
      </div>
    </div>
  );
};
