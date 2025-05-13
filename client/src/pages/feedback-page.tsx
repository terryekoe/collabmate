import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Feedback, User, Workspace } from "@shared/schema";

import AppLayout from "@/components/layout/app-layout";
import FeedbackForm from "@/components/feedback/feedback-form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedbackPage() {
  const { user } = useAuth();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  
  // Get workspaces
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });
  
  // Get workspace members when a workspace is selected
  const { data: members, isLoading: isLoadingMembers } = useQuery<User[]>({
    queryKey: [`/api/workspaces/${selectedWorkspace}/members`],
    enabled: !!selectedWorkspace,
  });
  
  // Get feedback when a workspace is selected (for leaders/admins)
  const { data: feedback, isLoading: isLoadingFeedback } = useQuery<Feedback[]>({
    queryKey: [`/api/workspaces/${selectedWorkspace}/feedback`],
    enabled: !!selectedWorkspace && (user?.role === 'admin' || user?.role === 'leader'),
  });
  
  // Handle workspace change
  const handleWorkspaceChange = (value: string) => {
    setSelectedWorkspace(value);
  };
  
  // Calculate average scores for a user
  const calculateUserScores = (userId: number) => {
    if (!feedback) return { effort: 0, communication: 0, reliability: 0, count: 0 };
    
    const userFeedback = feedback.filter(item => item.targetUserId === userId);
    if (userFeedback.length === 0) return { effort: 0, communication: 0, reliability: 0, count: 0 };
    
    const totalEffort = userFeedback.reduce((sum, item) => sum + item.effortScore, 0);
    const totalCommunication = userFeedback.reduce((sum, item) => sum + item.communicationScore, 0);
    const totalReliability = userFeedback.reduce((sum, item) => sum + item.reliabilityScore, 0);
    
    return {
      effort: +(totalEffort / userFeedback.length).toFixed(1),
      communication: +(totalCommunication / userFeedback.length).toFixed(1),
      reliability: +(totalReliability / userFeedback.length).toFixed(1),
      count: userFeedback.length
    };
  };
  
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-mono mb-4">Feedback</h1>
        
        <div className="max-w-md">
          <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
            <SelectTrigger className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
              <SelectValue placeholder="Select Workspace" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#0D1117] border-gray-200 dark:border-[#30363D]">
              {workspaces?.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id.toString()}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {!selectedWorkspace ? (
        <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Select a Workspace</h3>
            <p className="text-gray-500 dark:text-[#8B949E]">
              Choose a workspace to view feedback or submit new feedback
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="submit" className="mb-8">
          <TabsList className="bg-gray-200 dark:bg-[#161B22] rounded-lg p-1 mb-6">
            <TabsTrigger value="submit" className="px-4 py-2">Submit Feedback</TabsTrigger>
            {(user?.role === 'admin' || user?.role === 'leader') && (
              <TabsTrigger value="view" className="px-4 py-2">View Feedback</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="submit">
            <div className="max-w-lg mx-auto">
              <FeedbackForm workspaceId={parseInt(selectedWorkspace)} />
            </div>
          </TabsContent>
          
          {(user?.role === 'admin' || user?.role === 'leader') && (
            <TabsContent value="view">
              {isLoadingMembers || isLoadingFeedback ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <>
                  {members && members.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {members.map(member => {
                        const scores = calculateUserScores(member.id);
                        const hasFeedback = scores.count > 0;
                        
                        return (
                          <Card key={member.id} className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
                            <CardHeader>
                              <CardTitle className="text-lg font-semibold">{member.name}</CardTitle>
                              <CardDescription>
                                {hasFeedback 
                                  ? `Based on ${scores.count} feedback submissions`
                                  : "No feedback submitted yet"}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {hasFeedback ? (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <span>Effort</span>
                                    <div className="flex items-center">
                                      <span className="text-lg font-semibold mr-2">{scores.effort}</span>
                                      <span className="text-sm text-gray-500 dark:text-[#8B949E]">/ 5</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span>Communication</span>
                                    <div className="flex items-center">
                                      <span className="text-lg font-semibold mr-2">{scores.communication}</span>
                                      <span className="text-sm text-gray-500 dark:text-[#8B949E]">/ 5</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span>Reliability</span>
                                    <div className="flex items-center">
                                      <span className="text-lg font-semibold mr-2">{scores.reliability}</span>
                                      <span className="text-sm text-gray-500 dark:text-[#8B949E]">/ 5</span>
                                    </div>
                                  </div>
                                  
                                  <div className="pt-4 border-t border-gray-200 dark:border-[#30363D]">
                                    <span className="text-lg font-semibold">
                                      {((scores.effort + scores.communication + scores.reliability) / 3).toFixed(1)}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-[#8B949E]"> average rating</span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-500 dark:text-[#8B949E] text-center py-4">
                                  No feedback data available
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
                      <CardContent className="p-8 text-center">
                        <h3 className="text-lg font-semibold mb-2">No Members</h3>
                        <p className="text-gray-500 dark:text-[#8B949E]">
                          This workspace doesn't have any members yet
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}
    </AppLayout>
  );
}
