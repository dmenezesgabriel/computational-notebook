import { MenuIcon } from "lucide-react";
import { Button } from "./button";

interface HeaderProps {
  onToggleMenuClick: () => void;
}

export function Header({ onToggleMenuClick }: HeaderProps) {
  return (
    <header>
      <div className="flex flex-row px-5 py-2 items-center">
        <div className="flex flex-row items-center space-x-2">
          <Button.Root variant="secondary" onClick={onToggleMenuClick}>
            <MenuIcon className="w-4 h-4" />
          </Button.Root>
          <span className="text-lg text-slate-700">
            Computational Notebooks
          </span>
        </div>
      </div>
    </header>
  );
}
