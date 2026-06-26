import { ListTodo, ShoppingCart, Heart, BookHeart, Target } from "lucide-react";

const NAV = [
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "shopping", label: "Shop", icon: ShoppingCart },
  { id: "metime", label: "Me Time", icon: Heart },
  { id: "diary", label: "Diary", icon: BookHeart },
  { id: "goals", label: "Goals", icon: Target },
];

export const BottomNav = ({ active, onChange }) => (
  <nav
    data-testid="bottom-nav"
    className="bottom-nav fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[min(640px,calc(100vw-24px))]"
  >
    <div
      className="glass-hi flex items-center justify-around px-2 py-2"
      style={{ boxShadow: "0 18px 40px rgba(0,0,0,0.5)" }}
    >
      {NAV.map((n) => {
        const Icon = n.icon;
        const isActive = active === n.id;
        return (
          <button
            key={n.id}
            data-testid={`nav-${n.id}-btn`}
            onClick={() => onChange(n.id)}
            className="flex flex-col items-center gap-0.5 px-2 sm:px-3 py-2 rounded-xl transition-all"
            style={{
              background: isActive
                ? "linear-gradient(135deg, rgba(255,45,146,0.25), rgba(176,38,255,0.25))"
                : "transparent",
              color: isActive ? "#FF6BB4" : "var(--muted)",
            }}
          >
            <Icon size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{n.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
