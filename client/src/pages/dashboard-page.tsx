import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Activity, Task, User, Workspace } from "@shared/schema";
import { CheckSquare, Clock, MessageSquare, Users } from "lucide-react";

import AppLayout from "@/components/layout/app-layout";
import StatCard from "@/components/dashboard/stat-card";
import TaskCard from "@/components/dashboard/task-card";
import ActivityItem from "@/components/dashboard/activity-item";
import WorkspaceCard from "@/components/dashboard/workspace-card";
import ContributionBar from "@/components/dashboard/contribution-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskModal from "@/components/tasks/task-modal";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  // Get user's workspaces
  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });
  
  // Get recent tasks assigned to user
  const { data: assignedTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks/assigned"],
    enabled: !!user,
  });
  
  // Get user's recent activities
  const { data: recentActivities } = useQuery<(Activity & { user: User })[]>({
    queryKey: ["/api/activities/recent"],
    enabled: !!user,
  });
  
  // Get top contributors
  const { data: topContributors } = useQuery<User[]>({
    queryKey: ["/api/users/top-contributors"],
    enabled: !!user,
  });
  
  // Get task stats
  const { data: taskStats } = useQuery<{
    completed: number;
    total: number;
    onTimeCompletionRate: number;
    daysRemaining: number;
  }>({
    queryKey: ["/api/tasks/stats"],
    enabled: !!user,
  });
  
  // Get team stats
  const { data: teamStats } = useQuery<{
    memberCount: number;
    pendingFeedback: number;
  }>({
    queryKey: ["/api/team/stats"],
    enabled: !!user,
  });
  
  // Handle task edit
  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };
  
  // Close task modal
  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(undefined);
  };
  
  return (
    <AppLayout>
      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Tasks Completed"
          value={`${taskStats?.completed || 0} / ${taskStats?.total || 0}`}
          progress={taskStats?.total ? (taskStats.completed / taskStats.total) * 100 : 0}
          icon={<CheckSquare className="h-6 w-6 text-[#58A6FF]" />}
          iconBgClass="bg-blue-100 dark:bg-blue-900"
          subtitle={`${Math.round((taskStats?.completed || 0) / (taskStats?.total || 1) * 100)}% Complete`}
        />
        
        <StatCard
          title="On Time Completion"
          value={`${taskStats?.onTimeCompletionRate || 0}%`}
          progress={taskStats?.onTimeCompletionRate || 0}
          icon={<Clock className="h-6 w-6 text-[#7EE787]" />}
          iconBgClass="bg-green-100 dark:bg-green-900"
          progressBarColor="bg-[#7EE787]"
          subtitle={`${taskStats?.daysRemaining || 0} days remaining`}
        />
        
        <StatCard
          title="Team Members"
          value={`${teamStats?.memberCount || 0}`}
          icon={<Users className="h-6 w-6 text-purple-500" />}
          iconBgClass="bg-purple-100 dark:bg-purple-900"
          avatars={topContributors?.slice(0, 5).map(user => user.avatarUrl || '')}
          showViewAll={true}
          onClick={() => window.location.href = '/team'}
        />
        
        <StatCard
          title="Pending Feedback"
          value={`${teamStats?.pendingFeedback || 0}`}
          icon={<MessageSquare className="h-6 w-6 text-[#F0883E]" />}
          iconBgClass="bg-yellow-100 dark:bg-yellow-900"
          subtitle="Review Feedback"
          onClick={() => window.location.href = '/feedback'}
        />
      </div>
      
      {/* Workspaces */}
      {workspaces && workspaces.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-mono font-semibold mb-4">Your Workspaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map(workspace => (
              <WorkspaceCard 
                key={workspace.id} 
                workspace={workspace} 
                memberCount={5} // Replace with actual member count when available
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Tasks */}
      {assignedTasks && assignedTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-mono font-semibold mb-4">Your Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedTasks.slice(0, 3).map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={handleTaskEdit}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Team Performance */}
        {topContributors && topContributors.length > 0 && (
          <Card className="bg-white dark:bg-[#161B22] rounded-lg shadow overflow-hidden">
            <CardHeader className="p-4 border-b border-gray-200 dark:border-[#30363D]">
              <CardTitle className="font-semibold">Team Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {topContributors.slice(0, 4).map((contributor, index) => (
                  <ContributionBar
                    key={contributor.id}
                    user={contributor}
                    metric={{
                      value: 30 - (index * 5), // Mock data
                      label: "commits"
                    }}
                    percentage={85 - (index * 10)} // Mock data
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Recent Activity */}
        {recentActivities && recentActivities.length > 0 && (
          <Card className="bg-white dark:bg-[#161B22] rounded-lg shadow overflow-hidden">
            <CardHeader className="p-4 border-b border-gray-200 dark:border-[#30363D]">
              <CardTitle className="font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-gray-200 dark:divide-[#30363D]">
              {recentActivities.slice(0, 4).map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      
      {isTaskModalOpen && (
        <TaskModal 
          isOpen={isTaskModalOpen} 
          onClose={closeTaskModal} 
          task={selectedTask}
        />
      )}
    </AppLayout>
  );
}
