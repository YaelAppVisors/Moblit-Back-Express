const FolioCounter = require("../models/FolioCounter");

const DEFAULT_PREFIXES = {
  REQUEST: "TKT",
  REPORT: "RPT",
  HALLAZGO: "HAL",
  ADMIN: "ADM",
};

const padSequence = (sequence, length = 5) => String(sequence).padStart(length, "0");

const buildFolio = ({ prefix, year, sequence }) => `${prefix}-${year}-${padSequence(sequence)}`;

const nextFolio = async ({
  modulo,
  negocio = null,
  prefijo,
  anio = new Date().getFullYear(),
}) => {
  if (!modulo || typeof modulo !== "string") {
    throw new Error("modulo es obligatorio para generar folio");
  }

  const normalizedModulo = modulo.trim().toUpperCase();
  const normalizedPrefix = (prefijo || DEFAULT_PREFIXES[normalizedModulo] || normalizedModulo)
    .toString()
    .trim()
    .toUpperCase();

  const counter = await FolioCounter.findOneAndUpdate(
    {
      modulo: normalizedModulo,
      negocio: negocio || null,
      anio,
    },
    {
      $setOnInsert: {
        prefijo: normalizedPrefix,
        secuencia: 0,
        activo: true,
      },
      $inc: {
        secuencia: 1,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  const folio = buildFolio({
    prefix: counter.prefijo,
    year: counter.anio,
    sequence: counter.secuencia,
  });

  return {
    folio,
    secuencia: counter.secuencia,
    modulo: counter.modulo,
    anio: counter.anio,
  };
};

module.exports = {
  nextFolio,
};
