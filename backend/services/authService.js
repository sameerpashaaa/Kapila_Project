const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { getUserAuthContext } = require("./permissionService");

const ACCESS_TTL = process.env.JWT_ACCESS_TTL || "15m";
const REFRESH_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS || "7", 10);

function jwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET environment variable is missing.");
  }
  return process.env.JWT_SECRET;
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, roles: user.roles.map((role) => role.key) },
    jwtSecret(),
    { expiresIn: ACCESS_TTL }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret());
}

function createOpaqueToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueRefreshToken(userId, req) {
  // DB-03: Cleanup expired tokens periodically to prevent unbound growth
  if (Math.random() < 0.1) {
    await db("refresh_tokens").where("expires_at", "<", new Date()).delete().catch(() => {});
  }

  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  await db("refresh_tokens").insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: expiresAt,
    created_ip: req.ip || null,
    user_agent: req.get?.("user-agent") || null,
  });
  return { token, expiresAt };
}

async function rotateRefreshToken(token, req) {
  const tokenHash = hashToken(token);
  const existing = await db("refresh_tokens")
    .where("token_hash", tokenHash)
    .whereNull("revoked_at")
    .where("expires_at", ">", new Date())
    .first();

  if (!existing) {
    throw Object.assign(new Error("Invalid refresh token."), { status: 401 });
  }

  await db("refresh_tokens").where("id", existing.id).update({ revoked_at: db.fn.now() });
  const user = await getUserAuthContext(existing.user_id);
  if (!user || !user.is_active) {
    throw Object.assign(new Error("User inactive."), { status: 401 });
  }
  const refresh = await issueRefreshToken(user.id, req);
  return { user, accessToken: signAccessToken(user), refreshToken: refresh.token };
}

async function revokeRefreshToken(token) {
  if (!token) return;
  await db("refresh_tokens")
    .where("token_hash", hashToken(token))
    .whereNull("revoked_at")
    .update({ revoked_at: db.fn.now() });
}

async function revokeUserRefreshTokens(userId) {
  await db("refresh_tokens")
    .where("user_id", userId)
    .whereNull("revoked_at")
    .update({ revoked_at: db.fn.now() });
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  };
}

function publicUser(user) {
  return {
    id: user.id,
    employee_code: user.employee_code,
    name: user.name,
    email: user.email,
    phone: user.phone,
    is_active: user.is_active,
    must_change_password: user.must_change_password,
    last_login_at: user.last_login_at,
    roles: user.roles,
    permissions: user.permissions,
    departments: user.departments,
  };
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  cookieOptions,
  publicUser,
};
