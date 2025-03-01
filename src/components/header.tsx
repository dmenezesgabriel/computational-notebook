import { MenuIcon } from "lucide-react";

interface HeaderProps {
  onToggleMenuClick: () => void;
}

export function Header({ onToggleMenuClick }: HeaderProps) {
  return (
    <header>
      <div className="flex flex-row px-5 py-2 items-center">
        <div className="flex flex-row items-center space-x-2">
          <div className="hover:cursor-pointer" onClick={onToggleMenuClick}>
            <MenuIcon className="w-4 h-4" />
          </div>
          <h1>Computational Notebooks</h1>
        </div>
      </div>
    </header>
  );
}
