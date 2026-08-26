import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ identifier: z.string().min(1).max(255) }).parse(data))
  .handler(async ({ data }) => {
    const { lookupEmailForUsername } = await import("./auth-login.server");
    const email = await lookupEmailForUsername(data.identifier);
    return { email };
  });
