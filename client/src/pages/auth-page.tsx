import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Login schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

// Registration schema (extends insertUserSchema with password confirmation)
const registrationSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegistrationValues = z.infer<typeof registrationSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { loginMutation, registerMutation, user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in or after successful login/registration
  useEffect(() => {
    if (user) {
      // Add a small delay to ensure state is properly updated
      const redirectTimer = setTimeout(() => {
        navigate("/");
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, navigate, loginMutation.isSuccess, registerMutation.isSuccess]);

  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      name: "",
      role: "member",
    },
  });

  // Handle login submission
  const onLoginSubmit = (data: LoginValues) => {
    loginMutation.mutate(data);
  };

  // Handle registration submission
  const onRegisterSubmit = (data: RegistrationValues) => {
    // Remove confirmPassword field as it's not in the schema
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0D1117]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 dark:border-[#58A6FF] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-[#0D1117]">
      {/* Auth Forms */}
      <div className="flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#30363D]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-[#58A6FF]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-mono">CollabMate</CardTitle>
            <CardDescription>
              End the frustration of disorganized teamwork and bring structure to your collaborative projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your username"
                              className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter your password"
                              className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-[#58A6FF] hover:bg-blue-600"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Registration Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your full name"
                              className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Choose a username"
                              className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="Create a password"
                                className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="Confirm password"
                                className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full p-2 rounded-md bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-[#30363D] text-gray-900 dark:text-[#C9D1D9]"
                            >
                              <option value="admin">Admin</option>
                              <option value="leader">Leader</option>
                              <option value="member">Member</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-[#58A6FF] hover:bg-blue-600"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="hidden md:flex items-center justify-center bg-gray-50 dark:bg-[#161B22] p-8">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold font-mono mb-6 text-gray-900 dark:text-[#C9D1D9]">
            Collaborate Better with CollabMate
          </h1>
          <p className="text-lg mb-8 text-gray-600 dark:text-[#8B949E]">
            Eliminate miscommunication and missed deadlines. A platform that makes teamwork 
            seamless by solving the chaos of collaborative work in student and corporate environments.
          </p>
          <div className="space-y-4">
            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-[#58A6FF] mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-[#C9D1D9]">
                  Team Collaboration
                </h3>
                <p className="text-gray-600 dark:text-[#8B949E]">
                  Create workspaces, assign roles, and work together efficiently
                </p>
              </div>
            </div>
            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-[#7EE787] mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-[#C9D1D9]">
                  Task Management
                </h3>
                <p className="text-gray-600 dark:text-[#8B949E]">
                  Create and assign tasks with priorities, deadlines, and progress tracking
                </p>
              </div>
            </div>
            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center text-[#F0883E] mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-[#C9D1D9]">
                  Anonymous Feedback
                </h3>
                <p className="text-gray-600 dark:text-[#8B949E]">
                  Provide and receive constructive feedback anonymously
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
