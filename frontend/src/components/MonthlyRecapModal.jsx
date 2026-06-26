import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Share2, FileText, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { LIST_TYPES, LIST_META, monthKeyLabel } from "../hooks/useMonthlyGoals";
import { downloadIcs } from "../lib/icsExport";

function drawCard(ctx, { width, height, monthLabel, stats, items }) {
  // Background gradient (dark plum -> magenta -> indigo)
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, "#1B0A2A");
  g.addColorStop(0.5, "#3A0E5C");
  g.addColorStop(1, "#0E0617");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  // Soft pink radial glow top-left
  const r = ctx.createRadialGradient(width * 0.15, height * 0.1, 40, width * 0.15, height * 0.1, width * 0.7);
  r.addColorStop(0, "rgba(255,45,146,0.35)");
  r.addColorStop(1, "rgba(255,45,146,0)");
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, width, height);

  // Brand pill
  ctx.font = "bold 28px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "left";
  ctx.fillText("SUNDRY · MONTHLY RECAP", 64, 80);

  // Month title
  ctx.font = "bold 76px Inter, system-ui, sans-serif";
  const titleGrad = ctx.createLinearGradient(0, 100, 600, 200);
  titleGrad.addColorStop(0, "#FFD24A");
  titleGrad.addColorStop(0.5, "#FF8A3D");
  titleGrad.addColorStop(1, "#FF2D92");
  ctx.fillStyle = titleGrad;
  ctx.fillText(monthLabel, 64, 170);

  // Big completion ring (top-right)
  const cx = width - 180;
  const cy = 180;
  const radius = 100;
  // Ring background
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.lineWidth = 18;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();
  // Ring progress
  const angle = (stats.percent / 100) * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + angle);
  ctx.strokeStyle = "#FF2D92";
  ctx.lineCap = "round";
  ctx.stroke();
  // Percent label
  ctx.font = "bold 56px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(`${stats.percent}%`, cx, cy + 18);
  ctx.font = "600 18px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText("DONE", cx, cy + 44);

  // Stats summary row
  ctx.textAlign = "left";
  ctx.font = "600 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(
    `${stats.done} of ${stats.total} intentions checked off this month`,
    64,
    240
  );

  // 5 list cards (2x3 grid with last spanning if needed; we use 2 columns x 3 rows)
  const colW = (width - 64 - 64 - 30) / 2; // 64 padding each side, 30 gap
  const rowH = 140;
  const startY = 290;

  LIST_TYPES.forEach((lt, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 64 + col * (colW + 30);
    const y = startY + row * (rowH + 20);
    const meta = LIST_META[lt];
    const sub = stats.byList[lt] || { total: 0, done: 0 };

    // Card bg
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, x, y, colW, rowH, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Emoji
    ctx.font = "44px serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.fillText(meta.emoji, x + 24, y + 60);

    // List name
    ctx.font = "bold 22px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#FFD9EE";
    ctx.fillText(meta.title, x + 84, y + 46);

    // Stat
    ctx.font = "bold 32px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${sub.done} / ${sub.total}`, x + 84, y + 88);

    // Mini bar
    const barX = x + 24;
    const barY = y + rowH - 24;
    const barW = colW - 48;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(ctx, barX, barY, barW, 8, 4);
    ctx.fill();
    if (sub.total > 0) {
      const fillW = barW * (sub.done / sub.total);
      const lg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      lg.addColorStop(0, "#FFD24A");
      lg.addColorStop(1, "#FF2D92");
      ctx.fillStyle = lg;
      roundRect(ctx, barX, barY, fillW, 8, 4);
      ctx.fill();
    }
  });

  // Footer
  const footY = height - 80;
  ctx.font = "600 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.textAlign = "left";
  ctx.fillText("All your little things.", 64, footY);
  ctx.font = "bold 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#FF6BB4";
  ctx.fillText("sundry.app", 64, footY + 30);

  // Hint text right side
  ctx.font = "500 16px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "right";
  const sample = items.slice(0, 1)[0]?.title;
  if (sample) ctx.fillText(`Recent: ${sample.slice(0, 40)}`, width - 64, footY);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function MonthlyRecapModal({ open, onClose, monthKey, items, stats }) {
  const canvasRef = useRef(null);
  const monthLabel = useMemo(() => monthKeyLabel(monthKey), [monthKey]);
  const [busy, setBusy] = useState(false);

  // Render on open or data change
  useEffect(() => {
    if (!open) return;
    const c = canvasRef.current;
    if (!c) return;
    const W = 1200;
    const H = 900;
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    drawCard(ctx, { width: W, height: H, monthLabel, stats, items });
  }, [open, monthLabel, stats, items]);

  if (!open) return null;

  const downloadPng = async () => {
    setBusy(true);
    try {
      const c = canvasRef.current;
      const blob = await new Promise((res) => c.toBlob(res, "image/png"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sundry-recap-${monthKey}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Recap card saved ✨");
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = () => {
    setBusy(true);
    try {
      const c = canvasRef.current;
      const dataUrl = c.toDataURL("image/png");
      // Landscape A4
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      // Fit image
      const ratio = 1200 / 900;
      let imgW = pageW - 20;
      let imgH = imgW / ratio;
      if (imgH > pageH - 20) {
        imgH = pageH - 20;
        imgW = imgH * ratio;
      }
      const x = (pageW - imgW) / 2;
      const y = (pageH - imgH) / 2 - 10;
      pdf.setFillColor(14, 6, 23);
      pdf.rect(0, 0, pageW, pageH, "F");
      pdf.addImage(dataUrl, "PNG", x, y, imgW, imgH);

      // Second page: full text list grouped by list_type
      pdf.addPage();
      pdf.setFillColor(14, 6, 23);
      pdf.rect(0, 0, pageW, pageH, "F");
      pdf.setTextColor(255, 217, 238);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.text(`Sundry — ${monthLabel}`, 14, 20);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(245, 234, 247);
      pdf.text(`${stats.done} of ${stats.total} intentions complete (${stats.percent}%)`, 14, 28);

      let yPos = 42;
      for (const lt of LIST_TYPES) {
        const list = items.filter((i) => i.list_type === lt);
        if (list.length === 0) continue;
        if (yPos > pageH - 30) {
          pdf.addPage();
          pdf.setFillColor(14, 6, 23);
          pdf.rect(0, 0, pageW, pageH, "F");
          yPos = 20;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.setTextColor(255, 107, 180);
        pdf.text(`${LIST_META[lt].title}  (${stats.byList[lt].done}/${stats.byList[lt].total})`, 14, yPos);
        yPos += 7;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(245, 234, 247);
        for (const it of list) {
          if (yPos > pageH - 15) {
            pdf.addPage();
            pdf.setFillColor(14, 6, 23);
            pdf.rect(0, 0, pageW, pageH, "F");
            yPos = 20;
          }
          const prefix = it.checked ? "[x]" : "[ ]";
          pdf.text(`${prefix} ${it.title}`, 18, yPos);
          yPos += 6;
        }
        yPos += 4;
      }

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(200, 180, 220);
      pdf.text("Sundry · All your little things · sundry.app", 14, pageH - 8);

      pdf.save(`sundry-recap-${monthKey}.pdf`);
      toast.success("PDF saved 📄");
    } finally {
      setBusy(false);
    }
  };

  const shareNative = async () => {
    setBusy(true);
    try {
      const c = canvasRef.current;
      const blob = await new Promise((res) => c.toBlob(res, "image/png"));
      const file = new File([blob], `sundry-recap-${monthKey}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My ${monthLabel} on Sundry`,
          text: `${stats.done}/${stats.total} intentions (${stats.percent}%) for ${monthLabel} · Sundry`,
        });
      } else {
        downloadPng();
      }
    } catch {
      /* user dismissed */
    } finally {
      setBusy(false);
    }
  };

  const exportIcs = () => {
    downloadIcs(monthKey, items);
    toast.success("Calendar file saved 🗓️");
  };

  return (
    <div
      data-testid="recap-modal"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-hi max-w-3xl w-full p-5 md:p-6 slide-up"
        style={{ borderRadius: 24, maxHeight: "90vh", overflow: "auto" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-60">
              Monthly Recap
            </div>
            <div className="font-display text-2xl gradient-text-pink">{monthLabel}</div>
          </div>
          <button
            data-testid="recap-modal-close"
            onClick={onClose}
            className="w-9 h-9 rounded-full glass flex items-center justify-center"
            aria-label="Close"
          >
            <X size={15} strokeWidth={3} />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/10 mb-4">
          <canvas
            data-testid="recap-canvas"
            ref={canvasRef}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            data-testid="recap-download-png"
            disabled={busy}
            onClick={downloadPng}
            className="btn-pill btn-ghost inline-flex items-center justify-center gap-1.5 text-xs"
          >
            <Download size={13} strokeWidth={3} /> PNG
          </button>
          <button
            data-testid="recap-download-pdf"
            disabled={busy}
            onClick={downloadPdf}
            className="btn-pill btn-pink inline-flex items-center justify-center gap-1.5 text-xs"
          >
            <FileText size={13} strokeWidth={3} /> PDF
          </button>
          <button
            data-testid="recap-export-ics"
            disabled={busy}
            onClick={exportIcs}
            className="btn-pill btn-ghost inline-flex items-center justify-center gap-1.5 text-xs"
          >
            <Calendar size={13} strokeWidth={3} /> .ics
          </button>
          <button
            data-testid="recap-share"
            disabled={busy}
            onClick={shareNative}
            className="btn-pill btn-ghost inline-flex items-center justify-center gap-1.5 text-xs"
          >
            <Share2 size={13} strokeWidth={3} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
