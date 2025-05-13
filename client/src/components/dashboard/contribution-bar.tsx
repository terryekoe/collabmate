import { User } from '@shared/schema';

interface ContributionBarProps {
  user: User;
  metric: {
    value: number; 
    label: string;
  };
  percentage: number;
}

export default function ContributionBar({ user, metric, percentage }: ContributionBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="h-6 w-6 rounded-full mr-2" 
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 uppercase text-xs font-bold mr-2">
              {user.name.charAt(0)}
            </div>
          )}
          <span>{user.name}</span>
        </div>
        <span className="text-sm font-medium">{metric.value} {metric.label}</span>
      </div>
      <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-[#58A6FF] rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
