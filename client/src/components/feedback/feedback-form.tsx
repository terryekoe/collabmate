import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface FeedbackFormProps {
  workspaceId: number;
  onSuccess?: () => void;
}

const feedbackFormSchema = z.object({
  targetUserId: z.string().min(1, { message: "Please select a team member" }),
  effortScore: z.number().min(1).max(5),
  communicationScore: z.number().min(1).max(5),
  reliabilityScore: z.number().min(1).max(5),
  comments: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export default function FeedbackForm({ workspaceId, onSuccess }: FeedbackFormProps) {
  const { toast } = useToast();

  const { data: workspaceMembers } = useQuery<(User & { id: number })[]>({
    queryKey: [`/api/workspaces/${workspaceId}/members`],
    enabled: !!workspaceId,
  });

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      targetUserId: "",
      effortScore: 3,
      communicationScore: 3,
      reliabilityScore: 3,
      comments: "",
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormValues) => {
      const formattedData = {
        ...data,
        targetUserId: parseInt(data.targetUserId),
        workspaceId
      };
      
      const res = await apiRequest(
        "POST", 
        `/api/workspaces/${workspaceId}/feedback`, 
        formattedData
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Your feedback has been submitted anonymously",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/feedback`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedbackFormValues) => {
    submitFeedbackMutation.mutate(data);
  };

  return (
    <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
      <CardHeader>
        <CardTitle>Submit Anonymous Feedback</CardTitle>
        <CardDescription>
          Provide honest feedback to help your team members improve. All submissions are anonymous.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="targetUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Member</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-[#0D1117] border-gray-200 dark:border-[#30363D]">
                        <SelectValue placeholder="Select a team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:bg-[#0D1117] border-gray-200 dark:border-[#30363D]">
                      {workspaceMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effortScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effort Score: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between text-xs">
                    <span>Minimal Effort</span>
                    <span>Outstanding Effort</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="communicationScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Communication Score: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between text-xs">
                    <span>Poor Communication</span>
                    <span>Excellent Communication</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reliabilityScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reliability Score: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between text-xs">
                    <span>Unreliable</span>
                    <span>Highly Reliable</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any specific feedback or suggestions for improvement"
                      className="resize-none bg-white dark:bg-[#0D1117] border-gray-200 dark:border-[#30363D]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-[#58A6FF] hover:bg-blue-600 text-white"
          onClick={form.handleSubmit(onSubmit)}
          disabled={submitFeedbackMutation.isPending}
        >
          {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
        </Button>
      </CardFooter>
    </Card>
  );
}
