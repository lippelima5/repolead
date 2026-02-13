import { z } from "zod";
import { CustomError } from "@/lib/errors";

export async function parseJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    throw new CustomError("Invalid JSON body", 400);
  }

  const result = schema.safeParse(parsedBody);

  if (!result.success) {
    const errors = result.error.flatten();
    const fieldErrors = errors.fieldErrors as Record<string, string[] | undefined>;
    const firstField = Object.values(fieldErrors).find((messages) => messages && messages.length > 0)?.[0];
    throw new CustomError(firstField || "Invalid request payload", 400, fieldErrors);
  }

  return result.data;
}

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});



