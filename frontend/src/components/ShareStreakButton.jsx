import { useRef } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { readStreak } from "../lib/streak";

export const ShareStreakButton = () => {
  const canvasRef = useRef(null);

  const generate = () => {
    const { count } = readStreak();
    const c = document.createElement("canvas");
    c.width = 1080;
    c.height = 1920;
    const ctx = c.getContext("2d");

    // Gradient background
    const g = ctx.createLinearGradient(0, 0, 1080, 1920);
    g.addColorStop(0, "#1B0A2A");
    g.addColorStop(0.5, "#2A0B3D");
    g.addColorStop(1, "#15030F");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1080, 1920);

    // Glow blobs
    const r1 = ctx.createRadialGradient(200, 300, 0, 200, 300, 600);
    r1.addColorStop(0, "rgba(176,38,255,0.6)");
    r1.addColorStop(1, "rgba(176,38,255,0)");
    ctx.fillStyle = r1;
    ctx.fillRect(0, 0, 1080, 1920);

    const r2 = ctx.createRadialGradient(880, 1700, 0, 880, 1700, 700);
    r2.addColorStop(0, "rgba(255,45,146,0.5)");
    r2.addColorStop(1, "rgba(255,45,146,0)");
    ctx.fillStyle = r2;
    ctx.fillRect(0, 0, 1080, 1920);

    // SUNDRY brand
    ctx.font = "bold 48px Unbounded, sans-serif";
    ctx.fillStyle = "#FF6BB4";
    ctx.textAlign = "center";
    ctx.fillText("SUNDRY", 540, 280);

    // Flame
    ctx.font = "300px sans-serif";
    ctx.fillText("🔥", 540, 800);

    // Streak count
    const cg = ctx.createLinearGradient(0, 900, 1080, 1100);
    cg.addColorStop(0, "#FFD24A");
    cg.addColorStop(0.5, "#FF8A3D");
    cg.addColorStop(1, "#FF2D92");
    ctx.fillStyle = cg;
    ctx.font = "bold 320px Unbounded, sans-serif";
    ctx.fillText(String(count), 540, 1180);

    ctx.font = "bold 64px Unbounded, sans-serif";
    ctx.fillStyle = "#F5EAF7";
    ctx.fillText(count === 1 ? "DAY STREAK" : "DAY STREAK", 540, 1290);

    // Tagline
    ctx.font = "500 42px Manrope, sans-serif";
    ctx.fillStyle = "rgba(245,234,247,0.8)";
    ctx.fillText("All your little things.", 540, 1700);
    ctx.font = "bold 32px Manrope, sans-serif";
    ctx.fillStyle = "#FF6BB4";
    ctx.fillText("sundry.app", 540, 1770);

    return c;
  };

  const download = async () => {
    const c = generate();
    const blob = await new Promise((res) => c.toBlob(res, "image/png"));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sundry-streak.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Streak card downloaded 🔥");
  };

  const shareNative = async () => {
    const c = generate();
    const blob = await new Promise((res) => c.toBlob(res, "image/png"));
    const file = new File([blob], "sundry-streak.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My Sundry Streak", text: `🔥 ${readStreak().count}-day Sundry streak — your move.` });
      } catch {
        /* user dismissed */
      }
    } else {
      download();
    }
  };

  return (
    <div className="flex gap-2 mt-3" data-testid="share-streak-wrap">
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button data-testid="share-streak-btn" onClick={shareNative} className="btn-pill btn-pink inline-flex items-center gap-1.5 text-xs">
        <Share2 size={13} strokeWidth={3} /> Share streak
      </button>
      <button data-testid="download-streak-btn" onClick={download} className="btn-pill btn-ghost inline-flex items-center gap-1.5 text-xs">
        <Download size={13} strokeWidth={3} />
      </button>
    </div>
  );
};
