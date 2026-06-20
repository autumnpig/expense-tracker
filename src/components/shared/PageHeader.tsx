import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function PageHeader({ title, showBack = false, rightAction }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="w-10">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 -ml-2 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft size={22} />
            </button>
          )}
        </div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <div className="w-10 flex justify-end">{rightAction}</div>
      </div>
    </header>
  );
}
