import { useState, useEffect, useCallback, useMemo } from "react";
import { API_REPORTES } from "../config/api";
import { fmtDate, getBadge, badgeLabel } from "../utils/helpers";
import { computeStats } from "../utils/stats";
import { RotateCcw } from "lucide-react";
import Avatar from "../components/Avatar";
import CasePanel from "../components/CasePanel";
import BarChart from "../components/charts/BarChart";
import PieChart from "../components/charts/PieChart";
import LineChart from "../components/charts/LineChart";

export default function SST({ user }) {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpiFilter, setKpiFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [soloMios, setSoloMios] = useState(false);

  // --- NUEVOS ESTADOS DE FILTROS ---
  const [filterCiudad, setFilterCiudad] = useState("");
  const [filterCargo, setFilterCargo] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterDepartamento, setFilterDepartamento] = useState("");
  const [filterDireccion, setFilterDireccion] = useState("");

  const [selectedReporte, setSelectedReporte] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // --- ESTADOS PARA PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cargar reportes de SST
  const loadReportes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_REPORTES}?populate=*&pagination[pageSize]=40000`);
      const json = await res.json();
      const data = json.data || [];
      setReportes(data);
    } catch {
      setReportes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReportes(); }, [loadReportes]);

  // Extraer opciones únicas dinámicamente para los selectores de filtro
  const filterOptions = useMemo(() => {
    const ciudades = new Set();
    const cargos = new Set();
    const areas = new Set();
    const departamentos = new Set();
    const direcciones = new Set();

    reportes.forEach(r => {
      const a = r.attributes;
      if (a.colaborador_ciudad) ciudades.add(a.colaborador_ciudad.trim());
      if (a.colaborador_cargo) cargos.add(a.colaborador_cargo.trim());
      if (a.colaborador_area) areas.add(a.colaborador_area.trim());
      if (a.colaborador_departamento) departamentos.add(a.colaborador_departamento.trim());
      if (a.colaborador_direccion) direcciones.add(a.colaborador_direccion.trim());
    });

    return {
      ciudades: Array.from(ciudades).sort(),
      cargos: Array.from(cargos).sort(),
      areas: Array.from(areas).sort(),
      departamentos: Array.from(departamentos).sort(),
      direcciones: Array.from(direcciones).sort(),
    };
  }, [reportes]);

  function openCase(r) {
    setSelectedReporte(r);
    setPanelOpen(true);
  }

  const deleteReporte = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que deseas eliminar este reporte?")) return;
    
    try {
      await fetch(`${API_REPORTES}/${id}`, { method: "DELETE" });
      loadReportes();
    } catch (error) {
      alert("Error al eliminar el reporte.");
    }
  };

  const today = new Date();

  // KPIs
  const kpis = {
    todos: reportes.length,
    abierto: reportes.filter(r => r.attributes.estado?.toLowerCase() === "abierto").length,
    cerrado: reportes.filter(r => r.attributes.estado?.toLowerCase() === "cerrado").length,
    seguimiento: reportes.filter(r => r.attributes.estado?.toLowerCase() === "seguimiento").length,
    vencido: reportes.filter(r => {
      const gs = r.attributes.sstgestions?.data || [];
      return gs.some(g => g.attributes.temporalidad && new Date(g.attributes.temporalidad) < today);
    }).length,
  };

  // Filtros combinados
  const filtered = reportes.filter(r => {
    const a = r.attributes;
    const estado = a.estado?.toLowerCase();
    
    if (kpiFilter === "abierto" && estado !== "abierto") return false;
    if (kpiFilter === "cerrado" && estado !== "cerrado") return false;
    if (kpiFilter === "seguimiento" && estado !== "seguimiento") return false;
    if (kpiFilter === "vencido") {
      const gs = a.sstgestions?.data || [];
      const vencido = gs.some(g => g.attributes.temporalidad && new Date(g.attributes.temporalidad) < today);
      if (!vencido) return false;
    }
    if (soloMios) {
      const gs = a.sstgestions?.data || [];
      if (!gs.some(g => g.attributes.creador === user.nombre)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!a.colaborador_nombre?.toLowerCase().includes(q) &&
          !String(a.colaborador_documento).includes(q) &&
          !String(r.id).includes(q)) return false;
    }

    // --- APLICACIÓN DE LOS NUEVOS FILTROS ---
    if (filterCiudad && a.colaborador_ciudad?.trim() !== filterCiudad) return false;
    if (filterCargo && a.colaborador_cargo?.trim() !== filterCargo) return false;
    if (filterArea && a.colaborador_area?.trim() !== filterArea) return false;
    if (filterDepartamento && a.colaborador_departamento?.trim() !== filterDepartamento) return false;
    if (filterDireccion && a.colaborador_direccion?.trim() !== filterDireccion) return false;

    return true;
  });

  // Limpiar todos los filtros avanzados
  const clearSelectFilters = () => {
    setFilterCiudad("");
    setFilterCargo("");
    setFilterArea("");
    setFilterDepartamento("");
    setFilterDireccion("");
    setCurrentPage(1);
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const stats = computeStats(reportes);

  return (
    <div className="page">
      {/* KPIs Grid */}
      <div className="kpi-grid">
        {[
          { key: "todos", label: "Total", cls: "" },
          { key: "abierto", label: "Abiertos", cls: "kpi-abierto" },
          { key: "cerrado", label: "Cerrados", cls: "kpi-cerrado" },
          { key: "seguimiento", label: "En Seguimiento", cls: "kpi-seguimiento" },
          { key: "vencido", label: "Vencidos", cls: "kpi-vencido" },
        ].map(k => (
          <div key={k.key} className={`kpi-card ${k.cls} ${kpiFilter === k.key ? "active" : ""}`}
            onClick={() => {
              setKpiFilter(kpiFilter === k.key && k.key !== "todos" ? "todos" : k.key);
              setCurrentPage(1);
            }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{kpis[k.key]}</div>
            <div className="kpi-bar" />
          </div>
        ))}
      </div>

      {/* Stats Charts */}
      <div className="section-title" style={{ marginBottom: 14 }}>Estadísticas</div>
      <div className="stats-grid">
        <PieChart title="Estado de Casos" data={stats.estadoCasos} />
        <BarChart title="IMC" data={stats.imc} color="var(--gold)" />
        <PieChart title="Entidad" data={stats.entidad} />
        <BarChart title="Acción Realizada" data={stats.accion} color="var(--teal)" />
        <BarChart title="Sistema Afectado" data={stats.sistema} color="#E53E3E" />
        <PieChart title="Género" data={stats.genero} />
        <BarChart title="Categoría" data={stats.categoria} color="#805AD5" />
        <BarChart title="Diagnósticos CIE" data={stats.diagnostico} color="#D69E2E" />
        <BarChart title="Por Cargo" data={stats.cargo} color="#3182CE" />
        <LineChart title="Edad (rangos)" data={stats.edadRango} color="#10B981" />
        <LineChart title="Antigüedad (rangos)" data={stats.antiguedadRango} color="#F59E0B" />
        <BarChart title="Área" data={stats.area} color="#0F766E" />
      </div>

      {/* Tabla */}
      <div className="section-header">
        <div className="section-title">Historial de Casos</div>
      </div>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, padding: 12, background: "var(--gray-50)", borderRadius: "var(--radius-sm)", border: "1px solid var(--gray-200)", fontSize: 11}}>
        <button style={{ cursor: "pointer", backgroundColor: "transparent", border: "1px solid #ccc", borderRadius: "99px", padding: "0.5rem", display: "flex",  alignItems: "center", gap: 6}} onClick={loadReportes} disabled={loading}>
          <RotateCcw size={16} /> Recargar 
        </button>

        <input 
          className="search-input" 
          placeholder="Buscar por nombre o CC" 
          value={search} 
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
        />

        <select className="form-control" value={filterCiudad} onChange={e => { setFilterCiudad(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Ciudad</option>
          {filterOptions.ciudades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="form-control" value={filterCargo} onChange={e => { setFilterCargo(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Cargo</option>
          {filterOptions.cargos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="form-control" value={filterArea} onChange={e => { setFilterArea(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Área</option>
          {filterOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select className="form-control" value={filterDepartamento} onChange={e => { setFilterDepartamento(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Departamento</option>
          {filterOptions.departamentos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select className="form-control" value={filterDireccion} onChange={e => { setFilterDireccion(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Dirección</option>
          {filterOptions.direcciones.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        {(filterCiudad || filterCargo || filterArea || filterDepartamento || filterDireccion) && (
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={clearSelectFilters}
          >
            Limpiar Filtros
          </button>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input 
            type="checkbox" 
            checked={soloMios} 
            onChange={e => { setSoloMios(e.target.checked); setCurrentPage(1); }} 
          />
          Solo casos que he atendido
        </label>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            {loading ? (
              <div className="loading"><span className="spinner" />Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">No hay casos con los filtros seleccionados.</div>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Colaborador</th>
                      <th>Cargo y Área</th>
                      <th>Categoría</th>
                      <th>Estado</th>
                      <th>Fecha Reporte</th>
                      <th>Seg.</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map(r => {
                      const a = r.attributes;
                      const nSeg = a.sstgestions?.data?.length || 0;
                      return (
                        <tr key={r.id} className="clickable" onClick={() => openCase(r)}>
                          <td style={{ fontWeight: 700, color: "var(--navy)" }}>#{r.id}</td>
                          <td>
                            <div className="collab-cell">
                              <Avatar src={a.colaborador_foto} name={a.colaborador_nombre} size={34} />
                              <div>
                                <div className="collab-name">{a.colaborador_nombre}</div>
                                <div className="collab-doc">{a.colaborador_documento}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{a.colaborador_cargo || "—"}</div>
                            <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{a.colaborador_area || "—"}</div>
                          </td>
                          <td>
                            <div>{a.categoria || "—"}</div>
                          </td>
                          <td><span className={`badge ${getBadge(a.estado)}`}>{badgeLabel(a.estado)}</span></td>
                          <td style={{ color: "var(--gray-600)" }}>{fmtDate(a.fecha_creacion_manual)}</td>
                          <td>
                            {nSeg > 0
                              ? <span className="seguimiento-counter">{nSeg}</span>
                              : <span style={{ color: "var(--gray-400)", fontSize: 12 }}>—</span>}
                          </td>
                          <td>
                            <button 
                              className="btn btn-danger btn-sm" 
                              style={{ background: "#fee2e2", color: "#dc2626", border: "none" }}
                              onClick={(e) => deleteReporte(r.id, e)}
                              title="Eliminar"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderTop: "1px solid var(--gray-200)",
                  fontSize: 13,
                  color: "var(--gray-600)"
                }}>
                  <div>
                    Mostrando <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + itemsPerPage, filtered.length)}</strong> de <strong>{filtered.length}</strong> registros
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </button>
                    <span>
                      Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                    </span>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <CasePanel
        reporte={selectedReporte}
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelectedReporte(null);
        }}
        user={user}
        onGestionAdded={() => {
          loadReportes();
          if (selectedReporte) {
            fetch(`${API_REPORTES}/${selectedReporte.id}?populate=*`)
              .then(r => r.json())
              .then(j => { if (j.data) setSelectedReporte(j.data); })
              .catch(() => {});
          }
        }}
      />
    </div>
  );
}