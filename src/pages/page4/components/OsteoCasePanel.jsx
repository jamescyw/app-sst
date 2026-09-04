import { useState } from "react";
import { calcAge, calcYears, fmtDate, badgeLabel } from "../utils/helpers";
import OsteoGestionForm from "./OsteoGestionForm";

// NUEVAS VARIABLES
// En OsteoGestionForm.jsx y OsteoCasePanel.jsx
const API_GESTIONES = import.meta.env.VITE_API_GESTION; // Sin el _OSTEO
const API_REPORTES = import.meta.env.VITE_API_REPORTE; // Sin el _OSTEO

const getBadgeClasses = (estado = "") => {
  const e = estado.toLowerCase();
  if (e === "abierto") return "bg-orange-50 text-orange-600 border-orange-200";
  if (e === "cerrado") return "bg-green-50 text-green-700 border-green-200";
  if (e === "seguimiento") return "bg-teal-50 text-teal-700 border-teal-200";
  if (e === "vencido") return "bg-red-50 text-red-600 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

export default function OsteoCasePanel({ reporte, open, onClose, user, onGestionAdded }) {
  const [showGestionForm, setShowGestionForm] = useState(false);
  const [gestionToEdit, setGestionToEdit] = useState(null);
  
  if (!open || !reporte) return null;

  const attrs = reporte?.attributes;
  const gestiones = attrs?.sstgestions?.data || [];
  const archivos = attrs?.archivo?.data || [];

  const openNewGestion = () => {
    setGestionToEdit(null);
    setShowGestionForm(true);
  };

  const editGestion = (gestion) => {
    setGestionToEdit(gestion);
    setShowGestionForm(true);
  };

  const deleteGestion = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de eliminar este seguimiento?")) return;
    
    try {
      await fetch(`${API_GESTIONES}/${id}`, { method: "DELETE" });

      const gestionesRestantes = gestiones.filter(g => g.id !== id);
      const estadoNuevo = gestionesRestantes.length > 0 
        ? gestionesRestantes[gestionesRestantes.length - 1].attributes.estado_registrado 
        : "abierto"; 

      await fetch(`${API_REPORTES}/${reporte.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { estado: estadoNuevo } })
      });

      onGestionAdded(); 
    } catch (error) {
      alert("Error al eliminar el seguimiento");
    }
  };

  const age = attrs?.colaborador_birthday ? calcAge(attrs.colaborador_birthday) : null;
  const tenure = attrs?.colaborador_ingreso ? calcYears(attrs.colaborador_ingreso) : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full md:w-[1000px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <div>
            <div className="text-xs font-bold text-teal-600 mb-1 uppercase tracking-wider">Caso Osteo #{reporte.id}</div>
            <h2 className="text-xl font-bold text-gray-800">{attrs.colaborador_nombre}</h2>
          </div>
          <button className="text-gray-400 hover:text-gray-700 text-3xl leading-none transition-colors" onClick={onClose}>&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
          
          {/* FICHA EMPLEADO */}
          <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50 shadow-sm">
            <div className="flex flex-col items-center mb-6">
              {attrs.colaborador_foto ? (
                <img src={attrs.colaborador_foto} alt={attrs.colaborador_nombre} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-3xl border-2 border-gray-300 shadow-sm">
                  {attrs.colaborador_nombre ? attrs.colaborador_nombre.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <div className="font-bold text-gray-800 mt-3">{attrs.colaborador_nombre}</div>
              <div className="text-sm text-gray-500">{attrs.colaborador_documento}</div>
            </div>

            <div className="grid grid-cols-1 gap-1 text-sm">
              {[
                ["Cargo", attrs.colaborador_cargo],
                ["Área", attrs.colaborador_area],
                ["Departamento", attrs.colaborador_departamento],
                ["Dirección", attrs.colaborador_direccion],
                ["Celular", attrs.colaborador_celular],
                ["Correo", attrs.colaborador_correo],
                ["Ciudad", attrs.colaborador_ciudad],
                ["Edad", attrs.colaborador_birthday ? `${fmtDate(attrs.colaborador_birthday)} (${age} años)` : "—"],
                ["Antigüedad", attrs.colaborador_ingreso ? `${fmtDate(attrs.colaborador_ingreso)} (${tenure} años)` : "—"],
                ["Género", attrs.genero],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500 font-medium">{label}</span>
                  <span className="text-gray-800 text-right">{val || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DETALLES DEL REPORTE */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Detalles del Reporte</h3>
            <div className="grid grid-cols-1 gap-1 text-sm">
              {[
                ["Categoría", attrs.categoria], 
                ["Tipo Entidad", attrs.tipo_entidad?.toUpperCase()], 
                ["Nombre Entidad", attrs.nombre_entidad],
                ["Fecha Reporte", fmtDate(attrs.fecha_creacion_manual)], 
                ["Creado por", attrs.creador_reporte_nombre],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500 font-medium">{l}:</span>
                  <span className="text-gray-800 font-medium text-right">{v || "—"}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Estado actual:</span>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getBadgeClasses(attrs.estado)}`}>
                  {badgeLabel(attrs.estado)}
                </span>
              </div>
            </div>
            
            {attrs.descripcion && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                <span className="block font-semibold text-gray-800 mb-1">Descripción:</span>
                {attrs.descripcion}
              </div>
            )}

            {archivos.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Documentos Adjuntos</div>
                <div className="flex flex-wrap gap-2">
                  {archivos.map(a => (
                    <a key={a.id} href={a.attributes.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors">
                      📄 {a.attributes.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEGUIMIENTOS (GESTIONES) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
              <h3 className="text-lg font-bold text-gray-800">Seguimientos</h3>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm" onClick={openNewGestion}>
                + Nueva Gestión
              </button>
            </div>

            {gestiones.length === 0 ? (
              <div className="text-center p-6 text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No hay seguimientos registrados para este caso.
              </div>
            ) : (
              <div className="space-y-3">
                {[...gestiones].reverse().map(g => {
                  const ga = g.attributes;
                  return (
                    <div key={g.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow relative">
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-xs text-gray-500">
                          <span className="font-bold text-gray-800">{ga.creador}</span> 
                          <span className="mx-1.5">&bull;</span> 
                          {fmtDate(ga.fecha_hora)}
                          {ga.temporalidad && <span className="ml-2 bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Vence: {fmtDate(ga.temporalidad)}</span>}
                        </div>
                        <div className="flex gap-1">
                          <button className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition-colors" onClick={() => editGestion(g)}>Editar</button>
                          <button className="text-[11px] px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded transition-colors" onClick={(e) => deleteGestion(g.id, e)}>Eliminar</button>
                        </div>
                      </div>
                      
                      <div className="font-bold text-gray-800 text-sm mb-2">{ga.accion_realizada?.replace(/_/g, " ")}</div>
                      
                      {/* NUEVOS CAMPOS AQUÍ */}
                      <div className="space-y-1 text-xs text-gray-600 mb-3">
                        {ga.segmento_corporal && <div><span className="font-medium text-gray-700">Segmento Corporal:</span> {ga.segmento_corporal}</div>}
                        {ga.hemicuerpo_afectado && <div><span className="font-medium text-gray-700">Hemicuerpo:</span> {ga.hemicuerpo_afectado}</div>}
                        {ga.criticidad_sve && <div><span className="font-medium text-gray-700">Criticidad SVE:</span> {ga.criticidad_sve}</div>}
                        
                        {ga.categoria_cie && <div><span className="font-medium text-gray-700">CIE-10:</span> {ga.categoria_cie} — {ga.diagnostico}</div>}
                        {ga.diagnostico_sst && <div><span className="font-medium text-gray-700">Diagnóstico SST:</span> {ga.diagnostico_sst}</div>}
                      </div>

                      {ga.descripcion && (
                        <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-md border border-gray-100 italic">
                          "{ga.descripcion}"
                        </div>
                      )}

                      {ga.estado_registrado && (
                        <div className="mt-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getBadgeClasses(ga.estado_registrado)}`}>
                            Cambió estado a: {badgeLabel(ga.estado_registrado)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showGestionForm && (
        <OsteoGestionForm 
          user={user} 
          reporteId={reporte.id} 
          gestionToEdit={gestionToEdit} 
          onClose={() => setShowGestionForm(false)} 
          onSaved={() => { setShowGestionForm(false); onGestionAdded(); }} 
        />
      )}
    </>
  );
}