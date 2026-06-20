import { useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { label: '首页', icon: Home, path: '/' },
  { label: '记账', icon: PlusCircle, path: '/add' },
  { label: '报表', icon: BarChart3, path: '/reports' },
  { label: '我的', icon: Settings, path: '/settings' },
] as const;

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="max-w-[480px] mx-auto flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
