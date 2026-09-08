import { calcAge, calcYears } from "./helpers";

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
      (a.sst_actions_webs?.data || []).forEach(g => {
        const k = g.attributes.codigo_cie || (g.attributes.diagnostico_cie ? g.attributes.diagnostico_cie.slice(0, 30) : null);
        if (k) map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
  })();

  const accionData = (() => {
    const map = {};
    attrs.forEach(a => {
      (a.sst_actions_webs?.data || []).forEach(g => {
        const k = g.attributes.accion_realizada?.replace(/_/g, " ") || "Sin acción";
        map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  })();

  const sistemaData = (() => {
    const map = {};
    attrs.forEach(a => {
      (a.sst_actions_webs?.data || []).forEach(g => {
        const k = g.attributes.sistema_afectado;
        if (k) map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  })();

  const cargoData = (() => {
    const map = {};
    attrs.forEach(a => {
      const k = a.colaborador?.[0]?.cargo?.trim() || "Sin cargo";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
  })();

  return {
    estadoCasos: groupBy(a => a.estado),
    entidad: groupBy(a => a.tipo_entidad),
    genero: groupBy(a => a.colaborador?.[0]?.genero),
    categoria: groupBy(a => a.categoria?.replace(/_/g, " ")),
    accion: accionData,
    sistema: sistemaData,
    diagnostico: diagnosticoData,
    cargo: cargoData,
  };
}