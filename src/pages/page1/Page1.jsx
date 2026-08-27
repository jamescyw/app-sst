import { useState, useEffect, useCallback, useMemo } from "react";
import { API_REPORTES } from "./config/api";
import { fmtDate, badgeLabel } from "./utils/helpers";
import { computeStats } from "./utils/stats";
import { RotateCcw } from "lucide-react";
import Avatar from "./components/Avatar";
import CasePanel from "./components/CasePanel";
import BarChart from "./charts/BarChart";
import PieChart from "./charts/PieChart";
import LineChart from "./charts/LineChart";

// Función auxiliar para los colores de los badges con Tailwind
const getBadgeClasses = (estado = "") => {
  const e = estado.toLowerCase();
  if (e === "abierto") return "bg-[#FFF8ED] text-[#b7791f]";
  if (e === "cerrado") return "bg-[#F0FFF4] text-[#276749]";
  if (e === "seguimiento") return "bg-[#E6F7F6] text-[#007a70]";
  if (e === "vencido") return "bg-[#FFF5F5] text-[#E53E3E]";
  return "bg-gray-100 text-gray-700";
};

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
    <div className="max-w-[1400px] mx-auto py-7 px-6 font-sans text-gray-800">
      
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-7">
        {[
          { key: "todos", label: "Total", color: "bg-[#3c1f1c]" },
          { key: "abierto", label: "Abiertos", color: "bg-[#F5A623]" },
          { key: "cerrado", label: "Cerrados", color: "bg-[#38A169]" },
          { key: "seguimiento", label: "En Seguimiento", color: "bg-[#00B4A6]" },
          { key: "vencido", label: "Vencidos", color: "bg-[#E53E3E]" },
        ].map(k => {
          const isActive = kpiFilter === k.key;
          return (
            <div 
              key={k.key} 
              className={`bg-white rounded-[10px] py-4 px-5 border ${isActive ? "border-[#3c1f1c]" : "border-gray-200"} cursor-pointer relative overflow-hidden shadow-sm`}
              onClick={() => {
                setKpiFilter(kpiFilter === k.key && k.key !== "todos" ? "todos" : k.key);
                setCurrentPage(1);
              }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{k.label}</div>
              <div className="font-['DM_Sans',sans-serif] text-3xl font-bold text-[#3c1f1c]">{kpis[k.key]}</div>
              <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${k.key === "todos" && !isActive ? "bg-transparent" : k.color}`} />
            </div>
          );
        })}
      </div>

      {/* Stats Charts */}
      <div className="font-['DM_Sans',sans-serif] text-lg font-bold text-[#3c1f1c] mb-3.5">Estadísticas</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <PieChart title="Estado de Casos" data={stats.estadoCasos} />
        <BarChart title="IMC" data={stats.imc} color="#F5A623" />
        <PieChart title="Entidad" data={stats.entidad} />
        <BarChart title="Acción Realizada" data={stats.accion} color="#00B4A6" />
        <BarChart title="Sistema Afectado" data={stats.sistema} color="#E53E3E" />
        <PieChart title="Género" data={stats.genero} />
        <BarChart title="Categoría" data={stats.categoria} color="#805AD5" />
        <BarChart title="Diagnósticos CIE" data={stats.diagnostico} color="#D69E2E" />
        <BarChart title="Por Cargo" data={stats.cargo} color="#3182CE" />
        <LineChart title="Edad (rangos)" data={stats.edadRango} color="#10B981" />
        <LineChart title="Antigüedad (rangos)" data={stats.antiguedadRango} color="#F59E0B" />
        <BarChart title="Área" data={stats.area} color="#0F766E" />
      </div>

      {/* Tabla Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-['DM_Sans',sans-serif] text-lg font-bold text-[#3c1f1c]">Historial de Casos</div>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-2.5 mb-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-[11px]">
        <button 
          className="flex items-center gap-1.5 cursor-pointer bg-transparent border border-gray-300 rounded-full py-1.5 px-3 hover:bg-gray-200 transition-colors disabled:opacity-50" 
          onClick={loadReportes} 
          disabled={loading}
        >
          <RotateCcw size={16} /> Recargar 
        </button>

        <input 
          className="py-2 px-3 border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#00B4A6] bg-white w-full sm:w-auto" 
          placeholder="Buscar por nombre o CC" 
          value={search} 
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
        />

        <select className="py-2 px-3 border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#00B4A6] bg-white" value={filterCiudad} onChange={e => { setFilterCiudad(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Ciudad</option>
          {filterOptions.ciudades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="py-2 px-3 border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#00B4A6] bg-white" value={filterCargo} onChange={e => { setFilterCargo(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Cargo</option>
          {filterOptions.cargos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="py-2 px-3 border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#00B4A6] bg-white" value={filterArea} onChange={e => { setFilterArea(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Área</option>
          {filterOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select className="py-2 px-3 border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#00B4A6] bg-white" value={filterDepartamento} onChange={e => { setFilterDepartamento(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Departamento</option>
          {filterOptions.departamentos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select className="py-2 px-3 border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#00B4A6] bg-white" value={filterDireccion} onChange={e => { setFilterDireccion(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Dirección</option>
          {filterOptions.direcciones.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        {(filterCiudad || filterCargo || filterArea || filterDepartamento || filterDireccion) && (
          <button 
            className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors" 
            onClick={clearSelectFilters}
          >
            Limpiar Filtros
          </button>
        )}

        <label className="flex items-center gap-1.5 text-[13px] cursor-pointer ml-1">
          <input 
            type="checkbox" 
            checked={soloMios} 
            onChange={e => { setSoloMios(e.target.checked); setCurrentPage(1); }} 
            className="w-3.5 h-3.5 accent-[#00B4A6]"
          />
          Solo casos que he atendido
        </label>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-[10px] shadow-sm border border-gray-200 mb-6">
        <div className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center p-10 text-gray-500">
                <span className="inline-block w-5 h-5 border-2 border-gray-200 border-t-[#00B4A6] rounded-full animate-spin mr-2 align-middle" />
                Cargando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center p-10 text-gray-400 text-sm">No hay casos con los filtros seleccionados.</div>
            ) : (
              <>
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      <th className="text-left py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border-b-2 border-gray-200">ID</th>
                      <th className="text-left py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border-b-2 border-gray-200">Colaborador</th>
                      <th className="text-left py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border-b-2 border-gray-200">Cargo y Área</th>
                      <th className="text-left py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border-b-2 border-gray-200">Categoría</th>
                      <th className="text-left py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border-b-2 border-gray-200">Estado</th>
                      <th className="text-left py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border-b-2 border-gray-200">Fecha Reporte</th>
                      <th className="text-left py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border-b-2 border-gray-200">Seg.</th>
                      <th className="text-left py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border-b-2 border-gray-200">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map(r => {
                      const a = r.attributes;
                      const nSeg = a.sstgestions?.data?.length || 0;
                      return (
                        <tr key={r.id} className="cursor-pointer hover:bg-[#E6F7F6]" onClick={() => openCase(r)}>
                          <td className="py-3 px-3.5 border-b border-gray-100 align-middle font-bold text-[#3c1f1c]">#{r.id}</td>
                          <td className="py-3 px-3.5 border-b border-gray-100 align-middle">
                            <div className="flex items-center gap-2.5">
                              <div className="flex-shrink-0">
                                <Avatar src={a.colaborador_foto} name={a.colaborador_nombre} size={34} className="w-[34px] h-[34px] rounded-full object-cover bg-gray-200" />
                              </div>
                              <div>
                                <div className="font-semibold text-[13px]">{a.colaborador_nombre}</div>
                                <div className="text-[11px] text-gray-500">{a.colaborador_documento}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 border-b border-gray-100 align-middle">
                            <div className="text-[13px] font-semibold">{a.colaborador_cargo || "—"}</div>
                            <div className="text-[11px] text-gray-500">{a.colaborador_area || "—"}</div>
                          </td>
                          <td className="py-3 px-3.5 border-b border-gray-100 align-middle">
                            <div>{a.categoria || "—"}</div>
                          </td>
                          <td className="py-3 px-3.5 border-b border-gray-100 align-middle">
                            <span className={`inline-flex items-center py-[3px] px-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${getBadgeClasses(a.estado)}`}>
                              {badgeLabel(a.estado)}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 border-b border-gray-100 align-middle text-gray-600">
                            {fmtDate(a.fecha_creacion_manual)}
                          </td>
                          <td className="py-3 px-3.5 border-b border-gray-100 align-middle">
                            {nSeg > 0
                              ? <span className="inline-flex items-center gap-1 bg-[#FAF5FF] text-[#805AD5] text-[11px] font-bold py-[3px] px-2 rounded-full">{nSeg}</span>
                              : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="py-3 px-3.5 border-b border-gray-100 align-middle">
                            <button 
                              className="bg-red-100 text-red-600 hover:bg-red-200 transition-colors py-1.5 px-3 rounded-md text-xs font-semibold" 
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
                
                {/* Paginación */}
                <div className="flex items-center justify-between p-3 border-t border-gray-200 text-[13px] text-gray-600">
                  <div>
                    Mostrando <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + itemsPerPage, filtered.length)}</strong> de <strong>{filtered.length}</strong> registros
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </button>
                    <span>
                      Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                    </span>
                    <button 
                      className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
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