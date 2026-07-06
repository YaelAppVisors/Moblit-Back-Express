const Profile = require("../models/Profile");

const PERMISSIONS = {
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  NEGOCIOS_VIEW: "negocios:view",
  NEGOCIOS_MANAGE: "negocios:manage",
  REQUEST_VIEW: "request:view",
  REQUEST_CREATE: "request:create",
  REQUEST_UPDATE: "request:update",
  REQUEST_DELETE: "request:delete",
  HALLAZGOS_VIEW: "hallazgos:view",
  HALLAZGOS_CREATE: "hallazgos:create",
  HALLAZGOS_UPDATE: "hallazgos:update",
  HALLAZGOS_DELETE: "hallazgos:delete",
  PROFILES_VIEW: "profiles:view",
  PROFILES_MANAGE: "profiles:manage",
  ADMIN_DASHBOARD: "admin:dashboard",
  ADMIN_USERS: "admin:users",
  REPORTS_VIEW: "reports:view",
  REPORTS_GENERATE: "reports:generate",
  FOLIOS_VIEW: "folios:view",
  FOLIOS_MANAGE: "folios:manage",
};

const DEFAULT_PROFILE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  coor: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.NEGOCIOS_VIEW,
    PERMISSIONS.NEGOCIOS_MANAGE,
    PERMISSIONS.REQUEST_VIEW,
    PERMISSIONS.REQUEST_CREATE,
    PERMISSIONS.REQUEST_UPDATE,
    PERMISSIONS.HALLAZGOS_VIEW,
    PERMISSIONS.HALLAZGOS_CREATE,
    PERMISSIONS.HALLAZGOS_UPDATE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.FOLIOS_VIEW,
  ],
  tecnico: [
    PERMISSIONS.REQUEST_VIEW,
    PERMISSIONS.REQUEST_UPDATE,
    PERMISSIONS.HALLAZGOS_VIEW,
    PERMISSIONS.HALLAZGOS_UPDATE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  cliente: [
    PERMISSIONS.REQUEST_VIEW,
    PERMISSIONS.HALLAZGOS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  user: [
    PERMISSIONS.REQUEST_VIEW,
    PERMISSIONS.REQUEST_CREATE,
    PERMISSIONS.HALLAZGOS_VIEW,
  ],
};

const DEFAULT_PROFILE_DEFINITIONS = [
  {
    key: "admin",
    nombre: "Administrador",
    descripcion: "Acceso total a la plataforma",
    permisos: DEFAULT_PROFILE_PERMISSIONS.admin,
  },
  {
    key: "coor",
    nombre: "Coordinador",
    descripcion: "Opera solicitudes, hallazgos y reportes",
    permisos: DEFAULT_PROFILE_PERMISSIONS.coor,
  },
  {
    key: "tecnico",
    nombre: "Tecnico",
    descripcion: "Gestion operativa de tickets y hallazgos",
    permisos: DEFAULT_PROFILE_PERMISSIONS.tecnico,
  },
  {
    key: "cliente",
    nombre: "Cliente",
    descripcion: "Consulta operativa básica",
    permisos: DEFAULT_PROFILE_PERMISSIONS.cliente,
  },
  {
    key: "user",
    nombre: "Usuario",
    descripcion: "Acceso base a formularios y tickets",
    permisos: DEFAULT_PROFILE_PERMISSIONS.user,
  },
];

const normalizePermissions = (permissions = []) =>
  [...new Set((permissions || []).filter((permission) => typeof permission === "string" && permission.trim() !== ""))];

const getDefaultPermissionsByPerfil = (perfil) => {
  const key = typeof perfil === "string" ? perfil.toLowerCase() : "user";
  return DEFAULT_PROFILE_PERMISSIONS[key] || DEFAULT_PROFILE_PERMISSIONS.user;
};

const ensureDefaultProfiles = async () => {
  for (const definition of DEFAULT_PROFILE_DEFINITIONS) {
    const existing = await Profile.findOne({ key: definition.key });
    if (!existing) {
      await Profile.create({
        ...definition,
        sistema: true,
        activo: true,
      });
    }
  }
};

const resolveUserPermissions = (user = {}) => {
  const profilePermissions = Array.isArray(user?.perfil_ref?.permisos)
    ? user.perfil_ref.permisos
    : getDefaultPermissionsByPerfil(user.perfil);

  const overridePermissions = Array.isArray(user.permissions_override)
    ? user.permissions_override
    : [];

  return normalizePermissions([...profilePermissions, ...overridePermissions]);
};

module.exports = {
  PERMISSIONS,
  DEFAULT_PROFILE_DEFINITIONS,
  normalizePermissions,
  getDefaultPermissionsByPerfil,
  resolveUserPermissions,
  ensureDefaultProfiles,
};
