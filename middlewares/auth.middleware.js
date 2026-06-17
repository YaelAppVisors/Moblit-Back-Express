const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { resolveUserPermissions } = require("../services/rbac.service");

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7).trim();
  }

  const tokenHeader = req.headers["x-access-token"];
  if (typeof tokenHeader === "string" && tokenHeader.trim() !== "") {
    return tokenHeader.trim();
  }

  return null;
};

const requireAuth = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: "No autenticado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "change_this_secret");

    const user = await User.findById(decoded.sub)
      .select("-password")
      .populate("perfil_ref");

    if (!user) {
      return res.status(401).json({ message: "Usuario inválido" });
    }

    if (user.activo === false) {
      return res.status(403).json({ message: "Usuario inhabilitado" });
    }

    req.authUser = user;
    req.authPermissions = resolveUserPermissions(user);
    req.authTokenPayload = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido", error: error.message });
  }
};

module.exports = {
  requireAuth,
};
