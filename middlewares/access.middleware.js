const { resolveUserPermissions } = require("../services/rbac.service");

const hasPermissions = (ownedPermissions = [], requiredPermissions = [], anyOf = false) => {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
    return true;
  }

  if (!Array.isArray(ownedPermissions) || ownedPermissions.length === 0) {
    return false;
  }

  if (anyOf) {
    return requiredPermissions.some((permission) => ownedPermissions.includes(permission));
  }

  return requiredPermissions.every((permission) => ownedPermissions.includes(permission));
};

const requirePermissions = (requiredPermissions = [], options = {}) => {
  const { anyOf = false } = options;

  return (req, res, next) => {
    const authUser = req.authUser;

    if (!authUser) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (String(authUser.perfil || "").toLowerCase() === "admin") {
      return next();
    }

    const effectivePermissions =
      req.authPermissions || resolveUserPermissions(authUser);

    const allowed = hasPermissions(effectivePermissions, requiredPermissions, anyOf);

    if (!allowed) {
      return res.status(403).json({
        message: "No tienes permisos para acceder a este recurso",
        requiredPermissions,
      });
    }

    return next();
  };
};

module.exports = {
  requirePermissions,
};
