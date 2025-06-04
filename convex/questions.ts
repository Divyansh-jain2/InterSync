import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Fetch all questions
export const getQuestions = query({
  handler: async (ctx) => {
    return await ctx.db.query("questions").collect();
  },
});

// Add a new question
export const addQuestion = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    examples: v.array(
      v.object({
        input: v.string(),
        output: v.string(),
        explanation: v.optional(v.string()),
      })
    ),
    constraints: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("questions", {
      title: args.title,
      description: args.description,
      examples: args.examples,
      constraints: args.constraints,
      createdBy: "", // Add user validation if needed
    });
  },
});

// Delete a question
export const deleteQuestion = mutation({
    args: {
      questionId: v.id("questions"), // Expect an Id type for the "questions" table
    },
    handler: async (ctx, { questionId }) => {
      await ctx.db.delete(questionId);
    },
  });