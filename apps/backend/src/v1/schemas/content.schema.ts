import { z } from '@hono/zod-openapi';

export const ContentSchema = z
  .object({
    id: z.string().openapi({ example: '01957fc3-1239-7fb3-9df5-8914cd9c9172' }),
    shortId: z.string().openapi({ example: 'htBAp1s' }),
    title: z.string().openapi({ example: 'How to build APIs' }),
    slug: z.string().openapi({ example: 'how-to-build-apis' }),
    type: z.enum(['post', 'page']).openapi({ example: 'post' }),
    status: z
      .enum(['draft', 'published', 'private'])
      .nullable()
      .openapi({ example: 'published' }),
    authorId: z
      .string()
      .nullable()
      .openapi({ example: '01957fc2-8225-72ca-8b23-88d73d76d4ee' }),
    content: z
      .string()
      .nullable()
      .openapi({ example: 'Detailed content about APIs' }),
    createdAt: z
      .string()
      .nullable()
      .openapi({ example: '2025-03-10 09:00:00' }),
    updatedAt: z
      .string()
      .nullable()
      .openapi({ example: '2025-03-10 10:00:00' }),
    publishedAt: z
      .string()
      .nullable()
      .openapi({ example: '2025-03-10 09:30:00' }),
    deletedAt: z.string().nullable().openapi({ example: null }),
  })
  .openapi('Content');
