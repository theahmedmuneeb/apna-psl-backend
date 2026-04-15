import { Hono } from "hono";
import { apiSuccess, apiError } from "@/lib/api-response";
import type { AppVariables } from "@/api/types/app";
import { authMiddleware } from "@/api/middlewares/auth.middleware";
import { adminMiddleware } from "@/api/middlewares/admin.middleware";
import { profileMiddleware } from "@/api/middlewares/profile.middleware";
import { schemaValidator } from "@/api/middlewares/schemaValidator.middleware";
import {
  createTicketSchema,
  updateTicketSchema,
} from "@/api/schemas/ticket.schema";
import {
  signTicketSchema,
  confirmTicketSchema,
} from "@/api/schemas/ticket-signing.schema";
import * as ticketService from "@/api/services/ticket.service";
import {
  generateSignature,
  SigningError,
} from "@/api/services/ticket-signing.service";
import { confirmBooking } from "@/api/services/ticket-confirm.service";
import {
  reconcilePendingTickets,
  syncTicketTransfersFromChain,
} from "@/api/services/ticket-reconcile.service";

export const ticketRoute = new Hono<{ Variables: AppVariables }>();

// ── Blockchain signing endpoints ──
ticketRoute.post(
  "/sign",
  authMiddleware,
  profileMiddleware,
  schemaValidator(signTicketSchema),
  async (c) => {
    try {
      const user = c.get("supabaseUser");
      const data = c.get("validatedBody") as {
        userAddress: string;
        matchId: string;
        seatId: string;
      };
      const result = await generateSignature(
        data.userAddress,
        data.matchId,
        data.seatId,
        user.id,
      );
      return apiSuccess(c, result, {
        message: "Signature generated successfully",
      });
    } catch (err) {
      if (err instanceof SigningError) {
        return apiError(c, err.message, {
          statusCode: err.statusCode,
          error: err.errorCode,
        });
      }
      throw err;
    }
  },
);

ticketRoute.post(
  "/confirm",
  authMiddleware,
  profileMiddleware,
  schemaValidator(confirmTicketSchema),
  async (c) => {
    try {
      const data = c.get("validatedBody") as { txHash: string };
      const ticket = await confirmBooking(data.txHash);
      return apiSuccess(c, ticket, {
        statusCode: 201,
        message: "Ticket booking confirmed",
      });
    } catch (err) {
      if (err instanceof SigningError) {
        return apiError(c, err.message, {
          statusCode: err.statusCode,
          error: err.errorCode,
        });
      }
      console.error("[ticketRoute] Unexpected error in /confirm:", err);
      throw err;
    }
  },
);

ticketRoute.get("/recheck", authMiddleware, async (c) => {
  const [pendingResult, transferResult] = await Promise.allSettled([
    reconcilePendingTickets(),
    syncTicketTransfersFromChain(),
  ]);

  const pending =
    pendingResult.status === "fulfilled"
      ? pendingResult.value
      : {
          failed: true,
          error:
            pendingResult.reason instanceof Error
              ? pendingResult.reason.message
              : String(pendingResult.reason),
        };

  const transfers =
    transferResult.status === "fulfilled"
      ? transferResult.value
      : {
          failed: true,
          error:
            transferResult.reason instanceof Error
              ? transferResult.reason.message
              : String(transferResult.reason),
        };

  const hasAnyFailure =
    pendingResult.status === "rejected" || transferResult.status === "rejected";

  return apiSuccess(
    c,
    {
      pending,
      transfers,
      hasAnyFailure,
    },
    {
      message: hasAnyFailure
        ? "Recheck completed with partial failures"
        : "Reconciliation process completed",
    },
  );
});

// ── User route (must be defined BEFORE /:id to avoid conflict) ──
ticketRoute.get("/my", authMiddleware, profileMiddleware, async (c) => {
  const profile = c.get("profile");

  if (!profile.wallet) {
    return apiError(c, "No wallet linked to this profile", {
      statusCode: 400,
      error: "WALLET_NOT_LINKED",
    });
  }

  const tickets = await ticketService.getTicketsByWallet(profile.wallet);
  return apiSuccess(c, tickets, {
    message: "Your tickets fetched successfully",
  });
});

// ── Admin routes ──
ticketRoute.get("/", authMiddleware, async (c) => {
  const matchId = c.req.query("matchId");
  const ownerId = c.req.query("ownerId");
  const walletAddress = c.req.query("walletAddress");

  if (matchId) {
    const tickets = await ticketService.getTicketsByMatch(matchId);
    return apiSuccess(c, tickets, {
      message: "Tickets for match fetched successfully",
    });
  }
  if (ownerId) {
    const tickets = await ticketService.getTicketsByOwner(ownerId);
    return apiSuccess(c, tickets, {
      message: "Tickets for owner fetched successfully",
    });
  }
  if (walletAddress) {
    const tickets = await ticketService.getTicketsByWallet(walletAddress);
    return apiSuccess(c, tickets, {
      message: "Tickets for wallet fetched successfully",
    });
  }

  const tickets = await ticketService.getAllTickets();
  return apiSuccess(c, tickets, {
    message: "All tickets fetched successfully",
  });
});

ticketRoute.get("/:id", authMiddleware, async (c) => {
  const ticket = await ticketService.getTicketById(c.req.param("id"));
  if (!ticket)
    return apiError(c, "Ticket not found", {
      statusCode: 404,
      error: "NOT_FOUND",
    });
  return apiSuccess(c, ticket);
});

ticketRoute.post(
  "/",
  authMiddleware,
  adminMiddleware,
  schemaValidator(createTicketSchema),
  async (c) => {
    const data = c.get("validatedBody") as any;
    const ticket = await ticketService.createTicket(data);
    return apiSuccess(c, ticket, {
      statusCode: 201,
      message: "Ticket created",
    });
  },
);

ticketRoute.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  schemaValidator(updateTicketSchema),
  async (c) => {
    const data = c.get("validatedBody") as any;
    const ticket = await ticketService.updateTicket(c.req.param("id"), data);
    if (!ticket)
      return apiError(c, "Ticket not found", {
        statusCode: 404,
        error: "NOT_FOUND",
      });
    return apiSuccess(c, ticket, { message: "Ticket updated" });
  },
);

ticketRoute.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const ticket = await ticketService.deleteTicket(c.req.param("id"));
  if (!ticket)
    return apiError(c, "Ticket not found", {
      statusCode: 404,
      error: "NOT_FOUND",
    });
  return apiSuccess(c, ticket, { message: "Ticket deleted" });
});
