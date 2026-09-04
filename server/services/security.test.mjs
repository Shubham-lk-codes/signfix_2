import { describe, it, expect } from "vitest";
import { authenticate, authorize, permit } from "../middleware/auth.js";
import { errorHandler } from "../middleware/errorHandler.js";

describe("Phase 9 - Security & Authorization", () => {
  it("returns 401 Authentication Required when authorization token is missing", async () => {
    const req = { headers: {} };
    let status = null, jsonBody = null;
    const res = {
      status(code) { status = code; return this; },
      json(body) { jsonBody = body; return this; },
    };
    await authenticate(req, res, () => {});
    expect(status).toBe(401);
    expect(jsonBody).toEqual({ error: "Authentication required" });
  });

  it("returns 403 Insufficient Permission when role is unauthorized", () => {
    const middleware = authorize("super_admin", "admin");
    const req = { user: { id: 1, role: "customer" } };
    let status = null, jsonBody = null;
    const res = {
      status(code) { status = code; return this; },
      json(body) { jsonBody = body; return this; },
    };
    middleware(req, res, () => {});
    expect(status).toBe(403);
    expect(jsonBody).toEqual({ error: "Insufficient permission" });
  });

  it("allows authorized role to proceed", () => {
    const middleware = authorize("customer");
    const req = { user: { id: 2, role: "customer" } };
    let nextCalled = false;
    middleware(req, {}, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it("permits super_admin unconditionally", async () => {
    const middleware = permit("some.permission");
    const req = { user: { id: 1, role: "super_admin" } };
    let nextCalled = false;
    await middleware(req, {}, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it("suppresses error details in production environment", () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    let status = null, jsonBody = null;
    const res = {
      status(code) { status = code; return this; },
      json(body) { jsonBody = body; return this; },
    };
    const err = new Error("Sensitive internal database query failure stack trace");
    errorHandler(err, {}, res, () => {});

    expect(status).toBe(500);
    expect(jsonBody.message).toBe("Unexpected server error");
    expect(jsonBody.message).not.toContain("Sensitive internal database");
    process.env.NODE_ENV = origEnv;
  });
});
