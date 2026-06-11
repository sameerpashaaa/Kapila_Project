const { verifyAccessToken } = require("../services/authService");
const { getUserAuthContext } = require("../services/permissionService");

async function authenticate(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ success: false, error: "Authentication required" });

    const payload = verifyAccessToken(match[1]);
    const user = await getUserAuthContext(parseInt(payload.sub, 10));
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: "User inactive or not found" });
    }

    req.user = { ...user, permissions: new Set(user.permissions || []) };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

module.exports = { authenticate };
