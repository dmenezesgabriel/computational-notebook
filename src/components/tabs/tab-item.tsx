interface TabItemProps {
  isActive?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function TabItem({ isActive, onClick, children }: TabItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 text-sm cursor-pointer ${
        isActive
          ? "bg-white text-slate-700 border-t-2 border-t-blue-500"
          : "text-slate-500 hover:bg-slate-200"
      }`}
    >
      {children}
    </div>
  );
}
