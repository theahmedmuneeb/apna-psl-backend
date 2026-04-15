import { Hono } from "hono";
import { apiSuccess, apiError } from "@/lib/api-response";
import type { AppVariables } from "@/api/types/app";
import { authMiddleware } from "@/api/middlewares/auth.middleware";
import { adminMiddleware } from "@/api/middlewares/admin.middleware";
import { schemaValidator } from "@/api/middlewares/schemaValidator.middleware";
import {
  createMatchSchema,
  updateMatchSchema,
} from "@/api/schemas/match.schema";
import * as matchService from "@/api/services/match.service";

export const matchRoute = new Hono<{ Variables: AppVariables }>();

matchRoute.get("/", authMiddleware, async (c) => {
  const matches = await matchService.getAllMatches();
  console.log("Matches: ", matches);
  return apiSuccess(c, matches, { message: "Matches fetched successfully" });
});

matchRoute.get("/:id", authMiddleware, async (c) => {
  const match = await matchService.getMatchById(c.req.param("id"));
  if (!match)
    return apiError(c, "Match not found", {
      statusCode: 404,
      error: "NOT_FOUND",
    });
  return apiSuccess(c, match);
});

matchRoute.post(
  "/",
  authMiddleware,
  adminMiddleware,
  schemaValidator(createMatchSchema),
  async (c) => {
    const data = c.get("validatedBody") as any;
    const match = await matchService.createMatch(data);
    return apiSuccess(c, match, { statusCode: 201, message: "Match created" });
  },
);

matchRoute.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  schemaValidator(updateMatchSchema),
  async (c) => {
    const data = c.get("validatedBody") as any;
    const match = await matchService.updateMatch(c.req.param("id"), data);
    if (!match)
      return apiError(c, "Match not found", {
        statusCode: 404,
        error: "NOT_FOUND",
      });
    return apiSuccess(c, match, { message: "Match updated" });
  },
);

matchRoute.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const match = await matchService.deleteMatch(c.req.param("id"));
  if (!match)
    return apiError(c, "Match not found", {
      statusCode: 404,
      error: "NOT_FOUND",
    });
  return apiSuccess(c, match, { message: "Match deleted" });
});
