import { z } from 'zod';

export const ConfigSchema = z.object({
  ollama: z.object({
    apiUrl: z.string().url(),
    enabled: z.boolean(),
    defaultModels: z.object({
      chat: z.string().default('llama2:3b'),
      embedding: z.string().default('nomic-embed-text'),
    }),
  }),
  openai: z.object({
    apiKey: z.string().min(1),
    enabled: z.boolean(),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export const defaultConfig: Config = {
  ollama: {
    apiUrl: import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11400',
    enabled: true,
    defaultModels: {
      chat: 'llama2:3b',
      embedding: 'nomic-embed-text',
    },
  },
  openai: {
    apiKey: '',
    enabled: false,
  },
};