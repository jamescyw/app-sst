import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { fmtDate, badgeLabel } from "./utils/helpers";
import { computeStats } from "./utils/stats";
import { RotateCcw, Plus } from "lucide-react";

// Gráficas y Modales
import CasePanel from "./components/CasePanel";
import BarChart from "./charts/BarChart";
import PieChart from "./charts/PieChart";
import LineChart from "./charts/LineChart";
import ReporteForm from "./components/ReporteForm";

// Utilidad para colores de estado
const getBadgeClasses = (estado = "") => {
  const e = estado.toLowerCase();
  if (e === "abierto") return "bg-orange-50 text-orange-600 border border-orange-200";
  if (e === "cerrado") return "bg-green-50 text-green-700 border border-green-200";
  if (e === "seguimiento") return "bg-teal-50 text-teal-700 border border-teal-200";
  if (e === "vencido") return "bg-red-50 text-red-600 border border-red-200";
  return "bg-gray-100 text-gray-700 border border-gray-200";
};

const AvatarInline = ({ src, name }) => (
  src ? (
    <img src={src} alt={name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
  ) : (
    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-200">
      {name ? name.charAt(0).toUpperCase() : "?"}
    </div>
  )
);

export default function SaludGeneralModule() {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpiFilter, setKpiFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [soloMios, setSoloMios] = useState(false);

  // FILTROS AVANZADOS
  const [filterCiudad, setFilterCiudad] = useState("");
  const [filterCargo, setFilterCargo] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterDepartamento, setFilterDepartamento] = useState("");
  const [filterDireccion, setFilterDireccion] = useState("");

  const [selectedReporte, setSelectedReporte] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // ESTADOS MODAL LÍDER Y REPORTE
  const [isLiderModalOpen, setIsLiderModalOpen] = useState(false);
  const [liderCC, setLiderCC] = useState("");
  const [liderError, setLiderError] = useState("");
  const [validandoLider, setValidandoLider] = useState(false);
  const [liderValidado, setLiderValidado] = useState(null);
  const [isReporteFormOpen, setIsReporteFormOpen] = useState(false);

  // PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const API_REPORTES = import.meta.env.VITE_API_REPORTE_SG;
  const API_EMPLEADOS = import.meta.env.VITE_API_EMPLEADO;

  // CARGAR REPORTES
  // CARGAR REPORTES
  const loadReportes = useCallback(async () => {
    setLoading(true);
    try {
      // Se agrega el filtro filters[tipo_caso][$eq]=salud_general
      const res = await fetch(`${API_REPORTES}?filters[tipo_caso][$eq]=salud_general&populate=*`);
      const json = await res.json();
      setReportes(json.data || []);
    } catch {
      setReportes([]);
    } finally {
      setLoading(false);
    }
  }, [API_REPORTES]);

  useEffect(() => { loadReportes(); }, [loadReportes]);

  // ELIMINAR REPORTE
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

  // EXTRACCIÓN DE OPCIONES PARA FILTROS
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

  const clearSelectFilters = () => {
    setFilterCiudad("");
    setFilterCargo("");
    setFilterArea("");
    setFilterDepartamento("");
    setFilterDireccion("");
    setCurrentPage(1);
  };

  const handleValidarLider = async () => {
    if (!liderCC.trim()) return setLiderError("Ingrese la cédula del líder.");
    setValidandoLider(true);
    setLiderError("");
    try {
      const res = await fetch(`${API_EMPLEADOS}?documento=${liderCC.trim()}`);
      const json = await res.json();
      if (json.ok && json.data?.length) {
        setLiderValidado(json.data[0]); 
        setIsLiderModalOpen(false);
        setIsReporteFormOpen(true); 
        setLiderCC("");
      } else {
        setLiderError("Líder no encontrado o inactivo.");
      }
    } catch {
      setLiderError("Error de conexión al validar líder.");
    }
    setValidandoLider(false);
  };

  const today = new Date();
  const kpis = {
    todos: reportes.length,
    abierto: reportes.filter(r => r.attributes.estado?.toLowerCase() === "abierto").length,
    cerrado: reportes.filter(r => r.attributes.estado?.toLowerCase() === "cerrado").length,
    seguimiento: reportes.filter(r => r.attributes.estado?.toLowerCase() === "seguimiento").length,
    vencido: reportes.filter(r => (r.attributes.sstgestions?.data || []).some(g => g.attributes.temporalidad && new Date(g.attributes.temporalidad) < today)).length,
  };

  const filtered = reportes.filter(r => {
    const a = r.attributes;
    const estado = a.estado?.toLowerCase();
    
    if (kpiFilter !== "todos" && kpiFilter !== "vencido" && estado !== kpiFilter) return false;
    if (kpiFilter === "vencido" && !(a.sstgestions?.data || []).some(g => g.attributes.temporalidad && new Date(g.attributes.temporalidad) < today)) return false;
    if (soloMios && !(a.sstgestions?.data || []).some(g => g.attributes.creador === user?.nombre)) return false;
    
    if (search && !a.colaborador_nombre?.toLowerCase().includes(search.toLowerCase()) && !String(a.colaborador_documento).includes(search)) return false;
    
    if (filterCiudad && a.colaborador_ciudad?.trim() !== filterCiudad) return false;
    if (filterCargo && a.colaborador_cargo?.trim() !== filterCargo) return false;
    if (filterArea && a.colaborador_area?.trim() !== filterArea) return false;
    if (filterDepartamento && a.colaborador_departamento?.trim() !== filterDepartamento) return false;
    if (filterDireccion && a.colaborador_direccion?.trim() !== filterDireccion) return false;

    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const stats = computeStats(reportes);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col gap-6 ">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Salud General</h1>
          <p className="text-sm text-gray-500">Gestión global de ausentismos y casos de salud</p>
        </div>
        <button 
          onClick={() => setIsLiderModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Reporte de Líder
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { key: "todos", label: "Total", color: "bg-gray-800" },
          { key: "abierto", label: "Abiertos", color: "bg-orange-500" },
          { key: "cerrado", label: "Cerrados", color: "bg-green-600" },
          { key: "seguimiento", label: "En Seguimiento", color: "bg-teal-600" },
          { key: "vencido", label: "Vencidos", color: "bg-red-500" },
        ].map(k => (
          <div 
            key={k.key} 
            className={`bg-white rounded-lg p-4 border transition-all cursor-pointer relative overflow-hidden ${kpiFilter === k.key ? "border-gray-800 shadow-md" : "border-gray-200 hover:border-gray-300"}`}
            onClick={() => { setKpiFilter(kpiFilter === k.key ? "todos" : k.key); setCurrentPage(1); }}
          >
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">{k.label}</div>
            <div className="text-3xl font-bold text-gray-800">{kpis[k.key]}</div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${k.key === "todos" && kpiFilter !== "todos" ? "bg-transparent" : k.color}`} />
          </div>
        ))}
      </div>

      {/* ESTADÍSTICAS */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Estadísticas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><PieChart title="Estado de Casos" data={stats.estadoCasos} /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><BarChart title="IMC" data={stats.imc} color="#4B5563" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><PieChart title="Entidad" data={stats.entidad} /></div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><BarChart title="Acción Realizada" data={stats.accion} color="#4B5563" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><BarChart title="Sistema Afectado" data={stats.sistema} color="#EF4444" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><PieChart title="Género" data={stats.genero} /></div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><BarChart title="Categoría" data={stats.categoria} color="#8B5CF6" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><BarChart title="Diagnósticos CIE" data={stats.diagnostico} color="#D97706" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><BarChart title="Por Cargo" data={stats.cargo} color="#3B82F6" /></div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><LineChart title="Edad (rangos)" data={stats.edadRango} color="#10B981" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><LineChart title="Antigüedad (rangos)" data={stats.antiguedadRango} color="#F59E0B" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><BarChart title="Área" data={stats.area} color="#0F766E" /></div>
        </div>
      </div>

      {/* FILTROS DE TABLA */}
      <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-200 flex flex-wrap gap-2 items-center">
        <button onClick={loadReportes} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm hover:bg-gray-100 transition-colors disabled:opacity-50" disabled={loading}>
          <RotateCcw size={14} /> Recargar
        </button>

        <input className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 min-w-[180px]" placeholder="Buscar nombre o CC..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />

        <select className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white" value={filterCiudad} onChange={e => { setFilterCiudad(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Ciudad</option>
          {filterOptions.ciudades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white" value={filterCargo} onChange={e => { setFilterCargo(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Cargo</option>
          {filterOptions.cargos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white" value={filterArea} onChange={e => { setFilterArea(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Área</option>
          {filterOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white" value={filterDepartamento} onChange={e => { setFilterDepartamento(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Departamento</option>
          {filterOptions.departamentos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white" value={filterDireccion} onChange={e => { setFilterDireccion(e.target.value); setCurrentPage(1); }}>
          <option value="" disabled>Dirección</option>
          {filterOptions.direcciones.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {(filterCiudad || filterCargo || filterArea || filterDepartamento || filterDireccion) && (
          <button className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs font-semibold transition-colors" onClick={clearSelectFilters}>
            Limpiar Filtros
          </button>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer ml-auto bg-white px-3 py-1.5 border border-gray-200 rounded-md">
          <input type="checkbox" checked={soloMios} onChange={e => { setSoloMios(e.target.checked); setCurrentPage(1); }} className="rounded accent-blue-600 w-4 h-4" /> 
          Solo mis casos
        </label>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="overflow-x-auto w-full border border-gray-100 rounded-lg shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 font-semibold text-gray-600">ID</th>
              <th className="p-3 font-semibold text-gray-600">Colaborador</th>
              <th className="p-3 font-semibold text-gray-600">Cargo y Área</th>
              <th className="p-3 font-semibold text-gray-600">Categoría</th>
              <th className="p-3 font-semibold text-gray-600">Estado</th>
              <th className="p-3 font-semibold text-gray-600">Fecha</th>
              <th className="p-3 font-semibold text-gray-600 text-center">Seg.</th>
              <th className="p-3 font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="p-8 text-center text-gray-500">Cargando...</td></tr>
            ) : paginatedData.length === 0 ? (
              <tr><td colSpan="8" className="p-8 text-center text-gray-500">No se encontraron casos.</td></tr>
            ) : (
              paginatedData.map(r => {
                const a = r.attributes;
                const nSeg = a.sstgestions?.data?.length || 0;
                
                return (
                  <tr key={r.id} onClick={() => { setSelectedReporte(r); setPanelOpen(true); }} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer">
                    <td className="p-3 font-bold text-gray-800">#{r.id}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <AvatarInline src={a.colaborador_foto} name={a.colaborador_nombre} />
                        <div>
                          <div className="font-medium text-gray-800">{a.colaborador_nombre}</div>
                          <div className="text-xs text-gray-500">{a.colaborador_documento}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-gray-700 font-medium">{a.colaborador_cargo || "—"}</div>
                      <div className="text-gray-500 text-xs">{a.colaborador_area || "—"}</div>
                    </td>
                    <td className="p-3 text-gray-700">{a.categoria || "—"}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getBadgeClasses(a.estado)}`}>
                        {badgeLabel(a.estado)}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 whitespace-nowrap">{fmtDate(a.fecha_creacion_manual)}</td>
                    <td className="p-3 text-center">
                      {nSeg > 0 ? (
                        <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200">{nSeg}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md text-xs font-semibold transition-colors border border-red-100"
                        onClick={(e) => deleteReporte(r.id, e)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {/* Paginación */}
        <div className="flex items-center justify-between border-t border-gray-100 p-4 bg-white">
          <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50">Anterior</button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
      </div>

      {/* =========================================
          MODAL 1: SOLICITAR CC DEL LÍDER
          ========================================= */}
      {isLiderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Acceso Líder</h2>
              <button onClick={() => setIsLiderModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Ingrese la cédula del líder para registrar un nuevo caso en su nombre.</p>
            <input 
              type="number" 
              value={liderCC}
              onChange={(e) => setLiderCC(e.target.value)}
              placeholder="Ej: 10203040"
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
              onKeyDown={e => e.key === "Enter" && handleValidarLider()}
            />
            {liderError && <p className="text-xs text-red-500 mb-4">{liderError}</p>}
            <button 
              onClick={handleValidarLider} 
              disabled={validandoLider}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium text-sm transition-colors"
            >
              {validandoLider ? "Validando..." : "Continuar"}
            </button>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: FORMULARIO DE REPORTE
          ========================================= */}
      {isReporteFormOpen && liderValidado && (
        <ReporteForm 
          user={liderValidado} // Pasamos el líder validado como creador
          onClose={() => setIsReporteFormOpen(false)}
          onSaved={() => {
            setIsReporteFormOpen(false);
            loadReportes(); // Recargar la tabla SST
          }}
        />
      )}

      {/* PANEL DE CASO EXISTENTE */}
      <CasePanel
        reporte={selectedReporte}
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setSelectedReporte(null); }}
        user={user}
        onGestionAdded={() => loadReportes()}
      />
    </div>
  );
}