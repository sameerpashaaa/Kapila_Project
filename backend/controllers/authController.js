const db = require("../db");
const { comparePassword, hashPassword } = require("../services/passwordService");
const { getUserAuthContext } = require("../services/permissionService");
const {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  cookieOptions,
  publicUser,
} = require("../services/authService");
const { auditLog } = require("../services/auditService");

const REFRESH_COOKIE = "kapila_refresh";

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const userRow = await db("users").whereRaw("LOWER(email) = LOWER(?)", [email || ""]).first();

    if (!userRow || !userRow.is_active || !(await comparePassword(password || "", userRow.password_hash))) {
      await auditLog(req, {
        action: "auth.login_failed",
        resource: "auth",
        metadata: { email },
      });
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    await db("users").where("id", userRow.id).update({ last_login_at: db.fn.now() });
    const user = await getUserAuthContext(userRow.id);
    const accessToken = signAccessToken(user);
    const refresh = await issueRefreshToken(user.id, req);

    res.cookie(REFRESH_COOKIE, refresh.token, cookieOptions());
    await auditLog({ ...req, user }, { action: "auth.login", resource: "auth" });
    res.json({ success: true, data: { accessToken, user: publicUser(user) } });
  } catch (err) { next(err); }
}

async function me(req, res, next) {
  try {
    const user = await getUserAuthContext(req.user.id);
    res.json({ success: true, data: publicUser(user) });
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ success: false, error: "Refresh token required" });
    const result = await rotateRefreshToken(token, req);
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions());
    res.json({ success: true, data: { accessToken: result.accessToken, user: publicUser(result.user) } });
  } catch (err) { next(err); }
}

async function logout(req, res, next) {
  try {
    await revokeRefreshToken(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    await auditLog(req, { action: "auth.logout", resource: "auth" });
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    const userRow = await db("users").where("id", req.user.id).first();
    if (!req.user.must_change_password && !(await comparePassword(current_password || "", userRow.password_hash))) {
      return res.status(400).json({ success: false, error: "Current password is incorrect" });
    }
    const password_hash = await hashPassword(new_password);
    await db("users").where("id", req.user.id).update({
      password_hash,
      must_change_password: false,
      password_changed_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
    await revokeUserRefreshTokens(req.user.id);
    await auditLog(req, { action: "auth.password_changed", resource: "auth" });
    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { login, me, refresh, logout, changePassword };
