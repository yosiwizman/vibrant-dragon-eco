"use client";

interface UseCaseCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

export default function UseCaseCard({
  icon: Icon,
  title,
  description,
}: UseCaseCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-fuchsia-500/30 transition-all">
      <Icon className="h-8 w-8 text-fuchsia-400 mb-4" />
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}