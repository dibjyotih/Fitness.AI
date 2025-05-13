import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  workouts: defineTable({
    userId: v.id("users"),
    exercise: v.string(),
    targetReps: v.number(),
    completedReps: v.number(),
    completed: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
