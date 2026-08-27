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

// Ya no es necesario pasar empleadosByDoc porque la data viene en "reportes"
export function computeStats(reportes) {
  const attrs = reportes.map(r => r.attributes);

  function groupBy(fn) {
    const map = {};
    attrs.forEach(a => { 
      const k = fn(a) || "Desconocido"; 
      map[k] = (map[k] || 0) + 1; 
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
  }

  const imcData = (() => {
    const map = {};
    attrs.forEach(a => {
      const lastG = [...(a.sstgestions?.data || [])].reverse().find(g => g.attributes.peso_kg && g.attributes.talla_m);
      if (!lastG) return;
      const { peso_kg, talla_m } = lastG.attributes;
      const imc = peso_kg / (talla_m * talla_m);
      const category = imc < 18.5 ? "Bajo (<18.5)" : imc < 25 ? "Normal (18.5-24.9)" : imc < 30 ? "Sobrepeso (25-29.9)" : "Obeso (≥30)";
      map[category] = (map[category] || 0) + 1;
    });
    return Object.entries(map).map(([label, count]) => ({ label, count }));
  })();

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

  const sistemaData = (() => {
    const map = {};
    attrs.forEach(a => {
      (a.sstgestions?.data || []).forEach(g => {
        const k = g.attributes.sistema_afectado;
        if (k) map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  })();

  // --- CORRECCIÓN: Extrayendo Cargo directamente de attributes ---
  const cargoData = (() => {
    const map = {};
    attrs.forEach(a => {
      const k = a.colaborador_cargo?.trim() || "Sin cargo";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
  })();

  // --- CORRECCIÓN: Extrayendo Edad directamente de attributes y ordenando lógicamente ---
  const edadData = (() => {
    const map = {};
    attrs.forEach(a => {
      const age = a.colaborador_birthday ? calcAge(a.colaborador_birthday) : null;
      const k = getAgeRange(age);
      map[k] = (map[k] || 0) + 1;
    });
    // Se ordena alfabéticamente para que los rangos del LineChart tengan sentido (18-24, 25-34...)
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count }));
  })();

  // --- CORRECCIÓN: Extrayendo Antigüedad directamente de attributes y ordenando lógicamente ---
  const antiguedadData = (() => {
    const map = {};
    attrs.forEach(a => {
      const years = a.colaborador_ingreso ? calcYears(a.colaborador_ingreso) : null;
      const k = getAntiguedadRange(years);
      map[k] = (map[k] || 0) + 1;
    });
    // Se ordena alfabéticamente para que los rangos del LineChart tengan sentido (<1, 1-2, 3-4...)
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count }));
  })();

  // --- CORRECCIÓN: Extrayendo Área directamente de attributes ---
  const areaData = (() => {
    const map = {};
    attrs.forEach(a => {
      const k = a.colaborador_area || a.colaborador_departamento || "Sin área";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
  })();

  return {
    estadoCasos: groupBy(a => a.estado),
    entidad: groupBy(a => a.tipo_entidad),
    genero: groupBy(a => a.genero),
    categoria: groupBy(a => a.categoria?.replace(/_/g, " ")),
    imc: imcData,
    accion: accionData,
    sistema: sistemaData,
    diagnostico: diagnosticoData,
    cargo: cargoData,
    edadRango: edadData,
    antiguedadRango: antiguedadData,
    area: areaData,
  };
}