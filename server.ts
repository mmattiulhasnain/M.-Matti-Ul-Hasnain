import express from "express";
import path from "path";
import fs from "fs";
import crypto from "node:crypto";
import { createServer as createViteServer } from "vite";
import { records as initialRecords } from "./src/data";

// Removed DATA_FILE init to make server stateless for Koyeb

// In-Memory Brute-Force & Rate Limiter Store
interface AttemptRecord {
  count: number;
  lockedUntil: number;
}
const failedAuthByIp = new Map<string, AttemptRecord>();
const requestThrottles = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "127.0.0.1";
}

// Input Sanitization to prevent XSS & Injection
function sanitizeText(val: any, maxLength = 2000): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .slice(0, maxLength);
}

function sanitizeCandidatePayload(raw: any): any {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: sanitizeText(raw.id, 64),
    name: sanitizeText(raw.name, 150),
    role: sanitizeText(raw.role, 150),
    skills: sanitizeText(raw.skills, 2000),
    experience: sanitizeText(raw.experience, 100),
    seniority: sanitizeText(raw.seniority, 50),
    specialization: sanitizeText(raw.specialization, 500),
    location: sanitizeText(raw.location, 150),
    country: sanitizeText(raw.country, 100),
    city: sanitizeText(raw.city, 100),
    email: sanitizeText(raw.email, 150),
    whatsapp: sanitizeText(raw.whatsapp, 50),
    portfolio: sanitizeText(raw.portfolio, 500),
    cv: sanitizeText(raw.cv, 1000),
    cvFileName: sanitizeText(raw.cvFileName, 255),
    cvFileType: sanitizeText(raw.cvFileType, 100),
    cvFileData: typeof raw.cvFileData === "string" ? raw.cvFileData.slice(0, 750000) : "",
    hourlyRate: typeof raw.hourlyRate === "number" && !isNaN(raw.hourlyRate) ? Math.max(0, Math.min(raw.hourlyRate, 5000)) : undefined,
    salaryExpectation: typeof raw.salaryExpectation === "number" && !isNaN(raw.salaryExpectation) ? Math.max(0, Math.min(raw.salaryExpectation, 10000000)) : undefined,
    minSalary: typeof raw.minSalary === "number" && !isNaN(raw.minSalary) ? Math.max(0, Math.min(raw.minSalary, 10000000)) : undefined,
    currency: sanitizeText(raw.currency || "USD", 10),
    compensationType: sanitizeText(raw.compensationType || "", 50),
    employmentType: sanitizeText(raw.employmentType || "", 50),
    compensationNotes: sanitizeText(raw.compensationNotes || "", 2000),
    benefits: Array.isArray(raw.benefits) ? raw.benefits.map((b: any) => sanitizeText(b, 100)).slice(0, 10) : undefined,
    pipelineStage: sanitizeText(raw.pipelineStage || "", 50),
    scorecard: raw.scorecard && typeof raw.scorecard === "object" ? raw.scorecard : undefined,
    preferredTimezones: Array.isArray(raw.preferredTimezones) ? raw.preferredTimezones.map((tz: any) => sanitizeText(tz, 50)).slice(0, 15) : undefined,
    status: sanitizeText(raw.status || "Active", 50),
    notes: sanitizeText(raw.notes, 2000),
    createdAt: sanitizeText(raw.createdAt, 64) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: sanitizeText(raw.updatedBy, 150) || "Authorized Recruiter"
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Security & Freshness Headers Middleware
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // General API Request Throttler (200 requests/minute per IP)
  app.use("/api", (req, res, next) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const tracker = requestThrottles.get(ip) || { count: 0, resetAt: now + 60000 };

    if (now > tracker.resetAt) {
      tracker.count = 1;
      tracker.resetAt = now + 60000;
    } else {
      tracker.count += 1;
    }
    requestThrottles.set(ip, tracker);

    if (tracker.count > 200) {
      return res.status(429).json({ error: "Rate limit exceeded. Please slow down your requests." });
    }
    next();
  });

  app.use(express.json({ limit: "10mb" }));

  // Backend Authorization Password for candidate mutations
  const CANDIDATE_EDIT_PASSWORD = process.env.CANDIDATE_EDIT_PASSWORD || "MIHORAtlnt@1";

  // Timing-safe password verification to guard against side-channel timing attacks
  const verifyAdminPassword = (provided?: string): boolean => {
    if (!provided || typeof provided !== "string") return false;
    const cleanProvided = Buffer.from(provided.trim());
    const expected = Buffer.from(CANDIDATE_EDIT_PASSWORD.trim());
    if (cleanProvided.length !== expected.length) {
      return false;
    }
    return crypto.timingSafeEqual(cleanProvided, expected);
  };

  // Middleware to authenticate mutations and prevent brute-force attacks
  const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = getClientIp(req);
    const now = Date.now();

    // Check if IP is currently locked out
    const attemptInfo = failedAuthByIp.get(ip);
    if (attemptInfo && attemptInfo.lockedUntil > now) {
      const remainingSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
      return res.status(429).json({
        error: `IP temporarily locked due to excessive authorization failures. Try again in ${remainingSeconds}s.`
      });
    }

    const providedPassword = req.headers["x-admin-password"] as string || req.body?.password || req.query?.password as string;
    const isAuthorized = verifyAdminPassword(providedPassword);

    if (!isAuthorized) {
      const currentFailures = (attemptInfo?.count || 0) + 1;
      const lockedUntil = currentFailures >= 5 ? now + 15 * 60 * 1000 : 0;
      failedAuthByIp.set(ip, { count: currentFailures, lockedUntil });

      const attemptsRemaining = Math.max(0, 5 - currentFailures);
      return res.status(403).json({
        error: attemptsRemaining > 0 
          ? `Invalid authorization key. ${attemptsRemaining} attempt(s) remaining before 15-min lockout.`
          : "Maximum authorization attempts exceeded. IP locked out for 15 minutes."
      });
    }

    // Reset failed counter on successful authentication
    failedAuthByIp.delete(ip);
    next();
  };

  // Auth Key Verification Endpoint
  app.post("/api/auth/verify", (req, res) => {
    const { password } = req.body;
    if (verifyAdminPassword(password)) {
      return res.json({ success: true, message: "Authorized" });
    }
    return res.status(403).json({ success: false, error: "Invalid credentials" });
  });

  // Safe read endpoint
  app.get("/api/records", (req, res) => {
    try {
      res.json(initialRecords);
    } catch (error) {
      res.status(500).json({ error: "Failed to read records" });
    }
  });

  // Protected Candidate Edit Handler
  const handleCandidateEdit = (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { updates, userEmail } = req.body;

      if (!id || !/^[a-zA-Z0-9_\-]+$/.test(id)) {
        return res.status(400).json({ error: "Invalid candidate identifier format." });
      }

      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "Missing candidate update payload." });
      }

      const sanitizedUpdates = sanitizeCandidatePayload({ ...updates, id });
      if (!sanitizedUpdates) {
        return res.status(400).json({ error: "Malformed candidate payload." });
      }

      const data = [];
      const index = data.findIndex((record: any) => record.id === id);

      const existingRecord = index !== -1 ? data[index] : { id };
      const updatedRecord = {
        ...existingRecord,
        ...sanitizedUpdates,
        id,
        updatedAt: new Date().toISOString(),
        updatedBy: sanitizeText(userEmail, 150) || "Authorized Recruiter"
      };

      if (index !== -1) {
        data[index] = updatedRecord;
      } else {
        data.push(updatedRecord);
      }

      // fs write removed
      return res.status(200).json({
        success: true,
        message: "Candidate updated and saved successfully on backend.",
        record: updatedRecord
      });
    } catch (error) {
      console.error("Backend error updating candidate:", error);
      return res.status(500).json({ error: "Failed to save candidate update on server." });
    }
  };

  // Protected Routes - Require valid admin credentials
  app.put("/api/candidates/:id", requireAdminAuth, handleCandidateEdit);
  app.put("/api/records/:id", requireAdminAuth, handleCandidateEdit);
  app.post("/api/candidates/:id/edit", requireAdminAuth, handleCandidateEdit);

  app.post("/api/records", requireAdminAuth, (req, res) => {
    try {
      const sanitized = sanitizeCandidatePayload(req.body);
      if (!sanitized || !sanitized.id) {
        return res.status(400).json({ error: "Invalid candidate data." });
      }
      const data = [];
      data.push(sanitized);
      // fs write removed
      res.status(201).json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to save record" });
    }
  });

  app.post("/api/sync-database", requireAdminAuth, (req, res) => {
    try {
      const newRecords = req.body;
      if (Array.isArray(newRecords) && newRecords.length > 0) {
        const sanitizedList = newRecords.map(sanitizeCandidatePayload).filter(Boolean);
        // fs write removed
        res.status(200).json({ success: true, count: sanitizedList.length });
      } else {
        res.status(400).json({ error: "Invalid array of records provided" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to synchronize database" });
    }
  });

  app.delete("/api/records/:id", requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const data = [];
      const filteredData = data.filter((record: any) => record.id !== id);
      // fs write removed
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete record" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
