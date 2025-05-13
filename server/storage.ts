import { 
  User, InsertUser,
  Workspace, InsertWorkspace,
  WorkspaceMember, InsertWorkspaceMember,
  Project, InsertProject,
  ProjectMember, InsertProjectMember,
  Task, InsertTask,
  Feedback, InsertFeedback,
  Activity, InsertActivity,
  users, workspaces, workspaceMembers, projects, projectMembers, tasks, feedback, activities
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workspace methods
  getWorkspace(id: number): Promise<Workspace | undefined>;
  getWorkspacesByUserId(userId: number): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  
  // Workspace Member methods
  getWorkspaceMember(workspaceId: number, userId: number): Promise<WorkspaceMember | undefined>;
  getWorkspaceMembers(workspaceId: number): Promise<(WorkspaceMember & { user: User })[]>;
  isWorkspaceMember(workspaceId: number, userId: number): Promise<boolean>;
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByWorkspaceId(workspaceId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Project Member methods
  getProjectMember(projectId: number, userId: number): Promise<ProjectMember | undefined>;
  getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]>;
  isProjectMember(projectId: number, userId: number): Promise<boolean>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  
  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProjectId(projectId: number): Promise<(Task & { assignee: User })[]>;
  getTasksByAssigneeId(assigneeId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task>;
  
  // Feedback methods
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedbackByWorkspaceId(workspaceId: number): Promise<Feedback[]>;
  getFeedbackByTargetUserId(targetUserId: number): Promise<Feedback[]>;
  
  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByWorkspaceId(workspaceId: number): Promise<(Activity & { user: User })[]>;
  
  // Session store
  sessionStore: session.Store;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workspaces: Map<number, Workspace>;
  private workspaceMembers: Map<number, WorkspaceMember>;
  private projects: Map<number, Project>;
  private projectMembers: Map<number, ProjectMember>;
  private tasks: Map<number, Task>;
  private feedback: Map<number, Feedback>;
  private activities: Map<number, Activity>;
  
  sessionStore: session.Store;
  
  private currentUserId: number;
  private currentWorkspaceId: number;
  private currentWorkspaceMemberId: number;
  private currentProjectId: number;
  private currentProjectMemberId: number;
  private currentTaskId: number;
  private currentFeedbackId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.workspaces = new Map();
    this.workspaceMembers = new Map();
    this.projects = new Map();
    this.projectMembers = new Map();
    this.tasks = new Map();
    this.feedback = new Map();
    this.activities = new Map();
    
    this.currentUserId = 1;
    this.currentWorkspaceId = 1;
    this.currentWorkspaceMemberId = 1;
    this.currentProjectId = 1;
    this.currentProjectMemberId = 1;
    this.currentTaskId = 1;
    this.currentFeedbackId = 1;
    this.currentActivityId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 1 day
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Workspace methods
  async getWorkspace(id: number): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }

  async getWorkspacesByUserId(userId: number): Promise<Workspace[]> {
    // Get all workspace IDs where this user is a member
    const memberWorkspaceIds = Array.from(this.workspaceMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.workspaceId);
    
    // Get the workspaces for these IDs
    return Array.from(this.workspaces.values())
      .filter(workspace => memberWorkspaceIds.includes(workspace.id));
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const id = this.currentWorkspaceId++;
    const now = new Date();
    const workspace: Workspace = { ...insertWorkspace, id, createdAt: now };
    this.workspaces.set(id, workspace);
    return workspace;
  }

  // Workspace Member methods
  async getWorkspaceMember(workspaceId: number, userId: number): Promise<WorkspaceMember | undefined> {
    return Array.from(this.workspaceMembers.values()).find(
      member => member.workspaceId === workspaceId && member.userId === userId
    );
  }

  async getWorkspaceMembers(workspaceId: number): Promise<(WorkspaceMember & { user: User })[]> {
    const members = Array.from(this.workspaceMembers.values())
      .filter(member => member.workspaceId === workspaceId);
    
    return Promise.all(
      members.map(async member => {
        const user = await this.getUser(member.userId);
        return { ...member, user: user! };
      })
    );
  }

  async isWorkspaceMember(workspaceId: number, userId: number): Promise<boolean> {
    const member = await this.getWorkspaceMember(workspaceId, userId);
    return !!member;
  }

  async addWorkspaceMember(insertMember: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const id = this.currentWorkspaceMemberId++;
    const member: WorkspaceMember = { ...insertMember, id };
    this.workspaceMembers.set(id, member);
    return member;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByWorkspaceId(workspaceId: number): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.workspaceId === workspaceId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: Project = { ...insertProject, id, createdAt: now };
    this.projects.set(id, project);
    return project;
  }

  // Project Member methods
  async getProjectMember(projectId: number, userId: number): Promise<ProjectMember | undefined> {
    return Array.from(this.projectMembers.values()).find(
      member => member.projectId === projectId && member.userId === userId
    );
  }

  async getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]> {
    const members = Array.from(this.projectMembers.values())
      .filter(member => member.projectId === projectId);
    
    return Promise.all(
      members.map(async member => {
        const user = await this.getUser(member.userId);
        return { ...member, user: user! };
      })
    );
  }

  async isProjectMember(projectId: number, userId: number): Promise<boolean> {
    const member = await this.getProjectMember(projectId, userId);
    return !!member;
  }

  async addProjectMember(insertMember: InsertProjectMember): Promise<ProjectMember> {
    const id = this.currentProjectMemberId++;
    const member: ProjectMember = { ...insertMember, id };
    this.projectMembers.set(id, member);
    return member;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByProjectId(projectId: number): Promise<(Task & { assignee: User })[]> {
    const tasks = Array.from(this.tasks.values())
      .filter(task => task.projectId === projectId);
    
    return Promise.all(
      tasks.map(async task => {
        const assignee = await this.getUser(task.assigneeId);
        return { ...task, assignee: assignee! };
      })
    );
  }

  async getTasksByAssigneeId(assigneeId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assigneeId === assigneeId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date();
    const task: Task = { ...insertTask, id, createdAt: now };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<Task>): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    const updatedTask = { ...task, ...taskUpdate };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Feedback methods
  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.currentFeedbackId++;
    const now = new Date();
    const feedback: Feedback = { ...insertFeedback, id, createdAt: now };
    this.feedback.set(id, feedback);
    return feedback;
  }

  async getFeedbackByWorkspaceId(workspaceId: number): Promise<Feedback[]> {
    return Array.from(this.feedback.values())
      .filter(feedback => feedback.workspaceId === workspaceId);
  }

  async getFeedbackByTargetUserId(targetUserId: number): Promise<Feedback[]> {
    return Array.from(this.feedback.values())
      .filter(feedback => feedback.targetUserId === targetUserId);
  }

  // Activity methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, createdAt: now };
    this.activities.set(id, activity);
    return activity;
  }

  async getActivitiesByWorkspaceId(workspaceId: number): Promise<(Activity & { user: User })[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(
      activities.map(async activity => {
        const user = await this.getUser(activity.userId);
        return { ...activity, user: user! };
      })
    );
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure required fields have default values if not provided
    const userData = {
      ...insertUser,
      avatar_url: insertUser.avatarUrl ?? null, // Match database column naming convention
      role: insertUser.role || 'member' // Default to member if not specified
    };
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Workspace methods
  async getWorkspace(id: number): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async getWorkspacesByUserId(userId: number): Promise<Workspace[]> {
    const members = await db.select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));

    const workspaceIds = members.map(member => member.workspaceId);
    
    if (workspaceIds.length === 0) {
      return [];
    }
    
    // Use orWhere to create a OR condition for each workspace ID
    const workspaceList = await db.select().from(workspaces);
    return workspaceList.filter(workspace => workspaceIds.includes(workspace.id));
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const workspace = { 
      ...insertWorkspace, 
      description: insertWorkspace.description ?? null,
      category: insertWorkspace.category ?? null,
      deadline: insertWorkspace.deadline ?? null,
      createdAt: new Date() 
    };
    const [created] = await db.insert(workspaces).values(workspace).returning();
    return created;
  }

  // Workspace Member methods
  async getWorkspaceMember(workspaceId: number, userId: number): Promise<WorkspaceMember | undefined> {
    const [member] = await db.select()
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      ));
    return member;
  }

  async getWorkspaceMembers(workspaceId: number): Promise<(WorkspaceMember & { user: User })[]> {
    const members = await db.select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    
    const result = [];
    for (const member of members) {
      const [user] = await db.select().from(users).where(eq(users.id, member.userId));
      if (user) {
        result.push({ ...member, user });
      }
    }
    
    return result;
  }

  async isWorkspaceMember(workspaceId: number, userId: number): Promise<boolean> {
    const member = await this.getWorkspaceMember(workspaceId, userId);
    return !!member;
  }

  async addWorkspaceMember(insertMember: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const memberData = {
      ...insertMember,
      role: insertMember.role || 'member' // Set default role if not specified
    };
    const [member] = await db.insert(workspaceMembers).values(memberData).returning();
    return member;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsByWorkspaceId(workspaceId: number): Promise<Project[]> {
    return await db.select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const project = { 
      ...insertProject, 
      description: insertProject.description ?? null,
      deadline: insertProject.deadline ?? null,
      createdAt: new Date() 
    };
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  // Project Member methods
  async getProjectMember(projectId: number, userId: number): Promise<ProjectMember | undefined> {
    const [member] = await db.select()
      .from(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ));
    return member;
  }

  async getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]> {
    const members = await db.select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
    
    const result = [];
    for (const member of members) {
      const [user] = await db.select().from(users).where(eq(users.id, member.userId));
      if (user) {
        result.push({ ...member, user });
      }
    }
    
    return result;
  }

  async isProjectMember(projectId: number, userId: number): Promise<boolean> {
    const member = await this.getProjectMember(projectId, userId);
    return !!member;
  }

  async addProjectMember(insertMember: InsertProjectMember): Promise<ProjectMember> {
    const [member] = await db.insert(projectMembers).values(insertMember).returning();
    return member;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByProjectId(projectId: number): Promise<(Task & { assignee: User })[]> {
    const projectTasks = await db.select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));
    
    const result = [];
    for (const task of projectTasks) {
      const [assignee] = await db.select().from(users).where(eq(users.id, task.assigneeId));
      if (assignee) {
        result.push({ ...task, assignee });
      }
    }
    
    return result;
  }

  async getTasksByAssigneeId(assigneeId: number): Promise<Task[]> {
    return await db.select()
      .from(tasks)
      .where(eq(tasks.assigneeId, assigneeId));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const task = { 
      ...insertTask, 
      description: insertTask.description ?? null,
      deadline: insertTask.deadline ?? null,
      status: insertTask.status || 'todo',
      priority: insertTask.priority || 'medium',
      progress: insertTask.progress || 0,
      createdAt: new Date() 
    };
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async updateTask(id: number, taskUpdate: Partial<Task>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set(taskUpdate)
      .where(eq(tasks.id, id))
      .returning();
    
    if (!updatedTask) {
      throw new Error("Task not found");
    }
    
    return updatedTask;
  }

  // Feedback methods
  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const feedbackData = { 
      ...insertFeedback, 
      comments: insertFeedback.comments ?? null,
      createdAt: new Date() 
    };
    const [created] = await db.insert(feedback).values(feedbackData).returning();
    return created;
  }

  async getFeedbackByWorkspaceId(workspaceId: number): Promise<Feedback[]> {
    return await db.select()
      .from(feedback)
      .where(eq(feedback.workspaceId, workspaceId));
  }

  async getFeedbackByTargetUserId(targetUserId: number): Promise<Feedback[]> {
    return await db.select()
      .from(feedback)
      .where(eq(feedback.targetUserId, targetUserId));
  }

  // Activity methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activity = { 
      ...insertActivity, 
      entityId: insertActivity.entityId ?? null,
      entityType: insertActivity.entityType ?? null,
      createdAt: new Date() 
    };
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }

  async getActivitiesByWorkspaceId(workspaceId: number): Promise<(Activity & { user: User })[]> {
    const workspaceActivities = await db.select()
      .from(activities)
      .where(eq(activities.workspaceId, workspaceId))
      .orderBy(desc(activities.createdAt));
    
    const result = [];
    for (const activity of workspaceActivities) {
      const [user] = await db.select().from(users).where(eq(users.id, activity.userId));
      if (user) {
        result.push({ ...activity, user });
      }
    }
    
    return result;
  }
}

// Export an instance of the DatabaseStorage implementation
export const storage = new DatabaseStorage();
