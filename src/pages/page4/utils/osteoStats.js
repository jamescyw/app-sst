import { calcAge, calcYears } from "./helpers";

function getAgeRange(age) {
  if (age === null || age === undefined || Number.isNaN(age)) return "Sin dato";
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  return "55+";
}

function getAntiguedadRange(years) {
  if (years === null || years === undefined || Number.isNaN(years)) return "Sin dato";
  if (years < 1) return "<1 año";
  if (years < 3) return "1-2 años";
  if (years < 5) return "3-4 años";
  if (years < 8) return "5-7 años";
  if (years < 12) return "8-11 años";
  return "12+ años";
}

export function computeOsteoStats(reportes) {
  const attrs = reportes.map(r => r.attributes);

  function groupBy(fn) {
    const map = {};
    attrs.forEach(a => { 
      const k = fn(a) || "Desconocido"; 
      map[k] = (map[k] || 0) + 1; 
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
  }

  const diagnosticoData = (() => {
    const map = {};
    attrs.forEach(a => {
      (a.sstgestions?.data || []).forEach(g => {
        const k = g.attributes.categoria_cie || (g.attributes.diagnostico ? g.attributes.diagnostico.slice(0, 30) : null);
        if (k) map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
  })();

  const accionData = (() => {
    const map = {};
    attrs.forEach(a => {
      (a.sstgestions?.data || []).forEach(g => {
        const k = g.attributes.accion_realizada?.replace(/_/g, " ") || "Sin acción";
        map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  })();

  // NUEVO: Segmento Corporal en lugar de Sistema Afectado
  const segmentoData = (() => {
    const map = {};
    attrs.forEach(a => {
      (a.sstgestions?.data || []).forEach(g => {
        const k = g.attributes.segmento_corporal;
        if (k) map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  })();

  // NUEVO: Hemicuerpo
  const hemicuerpoData = (() => {
    const map = {};
    attrs.forEach(a => {
      (a.sstgestions?.data || []).forEach(g => {
        const k = g.attributes.hemicuerpo_afectado;
        if (k) map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  })();

  // NUEVO: Criticidad SVE
  const criticidadData = (() => {
    const map = {};
    attrs.forEach(a => {
      (a.sstgestions?.data || []).forEach(g => {
        const k = g.attributes.criticidad_sve;
        if (k) map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  })();

  const cargoData = (() => {
    const map = {};
    attrs.forEach(a => {
      const k = a.colaborador_cargo?.trim() || "Sin cargo";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
  })();

  return {
    estadoCasos: groupBy(a => a.estado),
    entidad: groupBy(a => a.tipo_entidad),
    genero: groupBy(a => a.genero),
    categoria: groupBy(a => a.categoria?.replace(/_/g, " ")),
    accion: accionData,
    segmento: segmentoData, // Reemplazó a sistema
    hemicuerpo: hemicuerpoData, // Nuevo
    criticidad: criticidadData, // Nuevo
    diagnostico: diagnosticoData,
    cargo: cargoData,
  };
}