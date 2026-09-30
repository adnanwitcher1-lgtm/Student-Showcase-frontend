import { z } from 'zod'

export const uploadSchema = z.object({
  // Step 1: Basic Info
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().optional(),

  // Step 2: Media
  cover_image: z.any().optional(),
  screenshots: z.any().optional(),

  // Step 3: Links
  github_url: z
    .string()
    .regex(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/, 'Enter a valid GitHub repo URL')
    .optional()
    .or(z.literal('')),
  live_demo_url: z
    .string()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal('')),
})