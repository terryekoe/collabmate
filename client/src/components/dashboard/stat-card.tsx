import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  progress?: number;
  icon: ReactNode;
  iconBgClass: string;
  progressBarColor?: string;
  subtitle?: string;
  avatars?: string[];
  showViewAll?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  progress,
  icon,
  iconBgClass,
  progressBarColor = 'bg-[#58A6FF]',
  subtitle,
  avatars,
  showViewAll = false,
  onClick
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#161B22] rounded-lg p-4 shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-md ${iconBgClass}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-[#8B949E]">{title}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="mt-4">
          <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full ${progressBarColor} rounded-full`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {subtitle && (
            <p className="text-right text-xs mt-1 text-gray-500 dark:text-[#8B949E]">{subtitle}</p>
          )}
        </div>
      )}
      
      {avatars && avatars.length > 0 && (
        <div className="mt-4 flex items-center">
          <div className="flex -space-x-2">
            {avatars.slice(0, 3).map((avatar, index) => (
              <img 
                key={index}
                src={avatar} 
                alt="Team member" 
                className="h-8 w-8 rounded-full border-2 border-white dark:border-[#161B22]" 
              />
            ))}
            {avatars.length > 3 && (
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-[#0D1117] flex items-center justify-center text-xs font-medium border-2 border-white dark:border-[#161B22]">
                +{avatars.length - 3}
              </div>
            )}
          </div>
          {showViewAll && (
            <a href="#" className="ml-auto text-sm text-[#58A6FF] hover:underline" onClick={onClick}>
              View All
            </a>
          )}
        </div>
      )}
      
      {!progress && !avatars && onClick && (
        <div className="mt-4">
          <button 
            className="w-full py-2 px-4 bg-gray-200 dark:bg-[#0D1117] hover:bg-gray-300 dark:hover:bg-gray-700 text-sm font-medium rounded-md transition"
            onClick={onClick}
          >
            {subtitle || "View Details"}
          </button>
        </div>
      )}
    </div>
  );
}
