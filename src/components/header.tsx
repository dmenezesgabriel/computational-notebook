import { MenuIcon } from "lucide-react";

interface HeaderProps {
  onToggleMenuClick: () => void;
}

export function Header({ onToggleMenuClick }: HeaderProps) {
  return (
    <header>
      <div className="flex flex-row px-5 py-2 items-center">
        <div className="flex flex-row items-center space-x-2">
          <MenuIcon onClick={onToggleMenuClick} className="w-4 h-4" />
          <h1>Computational Notebooks</h1>
        </div>
      </div>
    </header>
  );
}
