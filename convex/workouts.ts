import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createWorkout = mutation({
  args: {
    exercise: v.string(),
    targetReps: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db.insert("workouts", {
      userId,
      exercise: args.exercise,
      targetReps: args.targetReps,
      completedReps: 0,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

export const updateReps = mutation({
  args: {
    workoutId: v.id("workouts"),
    completedReps: v.number(),
  },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) throw new Error("Workout not found");
    
    await ctx.db.patch(args.workoutId, {
      completedReps: args.completedReps,
      completed: args.completedReps >= workout.targetReps,
    });
  },
});

export const getCurrentWorkout = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);
    
    return workouts[0];
  },
});
