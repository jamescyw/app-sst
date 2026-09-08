import { useState } from "react";
import { calcAge, calcYears, fmtDate, badgeLabel } from "../utils/helpers";
import OsteoGestionForm from "./OsteoGestionForm";

const API_GESTIONES = import.meta.env.VITE_API_GESTION; 
const API_REPORTES = import.meta.env.VITE_API_REPORTE; 

const getBadgeClasses = (estado = "") => {
  const e = estado.toLowerCase();
  if (e === "abierto") return "bg-orange-50 text-orange-600 border-orange-200";
  if (e === "cerrado") return "bg-green-50 text-green-700 border-green-200";
  if (e === "seguimiento") return "bg-teal-50 text-teal-700 border-teal-200";
  if (e === "vencido") return "bg-red-50 text-red-600 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

// Mini componente para los avatares
const AvatarInline = ({ src, name, size = 32 }) => (
  src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1px solid #e5e7eb", flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontWeight: "bold", fontSize: size * 0.4, border: "1px solid #e5e7eb", flexShrink: 0 }}>
      {name ? name.charAt(0).toUpperCase() : "?"}
    </div>
  )
);

export default function OsteoCasePanel({ reporte, open, onClose, user, onGestionAdded }) {
  const [showGestionForm, setShowGestionForm] = useState(false);
  const [gestionToEdit, setGestionToEdit] = useState(null);
  
  if (!open || !reporte) return null;

  const attrs = reporte?.attributes;
  const colab = attrs?.colaborador?.[0] || {};
  const creador = attrs?.creador?.[0] || {};
  const gestiones = attrs?.sst_actions_webs?.data || [];
  
  // Normalizar los adjuntos (Strapi puede devolver un objeto o un array)
  const adjuntosData = attrs?.adjuntos?.data;
  const archivos = Array.isArray(adjuntosData) ? adjuntosData : (adjuntosData ? [adjuntosData] : []);

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
      const estadoNuevo = gestionesRestantes.length > 0 ? gestionesRestantes[gestionesRestantes.length - 1].attributes.estado : "abierto"; 

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

  const age = colab.nacimiento ? calcAge(colab.nacimiento) : null;
  const tenure = colab.antiguedad ? calcYears(colab.antiguedad) : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      {/* Ajustamos el ancho máximo a 1200px o 95% de la pantalla para el layout 30/70 */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[95vw] lg:max-w-[1200px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-sm z-10">
          <div>
            <div className="text-xs font-bold text-teal-600 mb-0.5 uppercase tracking-wider">Caso Osteo #{reporte.id}</div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {colab.nombre}
              <span className={`ml-2 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${getBadgeClasses(attrs.estado)}`}>
                {badgeLabel(attrs.estado)}
              </span>
            </h2>
          </div>
          <button className="text-gray-400 hover:text-gray-700 text-3xl leading-none transition-colors" onClick={onClose}>&times;</button>
        </div>

        {/* CONTENEDOR PRINCIPAL: Flex row en desktop (30% izq / 70% der) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50">
          
          {/* COLUMNA IZQUIERDA (30%) - Información Fija */}
          <div className="w-full md:w-[35%] lg:w-[30%] overflow-y-auto bg-white border-r border-gray-200 p-5 space-y-6">
            
            {/* PERFIL EMPLEADO */}
            <div>
              <div className="flex flex-col items-center mb-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50 shadow-sm">
                <AvatarInline src={colab.foto} name={colab.nombre} size={70} />
                <div className="font-bold text-gray-800 mt-2 text-center leading-tight">{colab.nombre}</div>
                <div className="text-sm text-gray-500">{colab.documento}</div>
              </div>

              <div className="space-y-1.5 text-sm">
                {[
                  ["Cargo", colab.cargo],
                  ["Área", colab.area],
                  ["Departamento", colab.departamento],
                  ["Dirección", colab.direccion],
                  ["Ciudad", colab.ciudad],
                  ["Edad", colab.nacimiento ? `${age} años` : "—"],
                  ["Antigüedad", colab.antiguedad ? `${tenure} años` : "—"],
                  ["Celular", colab.celular],
                  ["Correo", colab.correo],
                  ["Género", colab.genero],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center pb-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-800 font-medium text-right">{val || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DETALLES DEL REPORTE */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Info del Reporte</h3>
              
              <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                <div className="text-xs text-blue-600 font-semibold mb-2 uppercase">Reportado por (Líder)</div>
                <div className="flex items-center gap-2">
                  <AvatarInline src={creador.foto} name={creador.nombre} size={28} />
                  <div className="text-sm font-medium text-gray-800 leading-tight">
                    {creador.nombre || "Sistema"} <br/>
                    <span className="text-xs text-gray-500 font-normal">{creador.documento}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 font-medium">Fecha: <span className="text-gray-800">{fmtDate(attrs.fecha_creacion_manual)}</span></div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex flex-col pb-1.5 border-b border-gray-50"><span className="text-gray-500 text-xs">Categoría</span><span className="text-gray-800 font-medium">{attrs.categoria}</span></div>
                <div className="flex flex-col pb-1.5 border-b border-gray-50"><span className="text-gray-500 text-xs">Entidad ({attrs.tipo_entidad})</span><span className="text-gray-800 font-medium">{attrs.nombre_entidad}</span></div>
                {attrs.descripcion && (
                  <div className="flex flex-col mt-2">
                    <span className="text-gray-500 text-xs mb-1">Descripción:</span>
                    <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-700 italic text-xs leading-relaxed">"{attrs.descripcion}"</div>
                  </div>
                )}
              </div>

              {archivos.length > 0 && (
                <div className="mt-4">
                  <span className="text-gray-500 text-xs mb-1.5 block">Archivos Adjuntos:</span>
                  <div className="flex flex-col gap-1.5">
                    {archivos.map(a => (
                      <a key={a.id} href={a.attributes?.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors text-blue-600 truncate">
                        Ver Documento Adjunto
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA (70%) - Seguimientos */}
          <div className="w-full md:w-[65%] lg:w-[70%] overflow-y-auto p-4 md:p-6 bg-gray-50/80">
            <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Historial de Seguimientos</h3>
                <p className="text-xs text-gray-500">Gestiones y registros del área SST</p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-1" onClick={openNewGestion}>
                + Agregar Seguimiento
              </button>
            </div>

            {gestiones.length === 0 ? (
              <div className="text-center p-8 text-gray-500 text-sm bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                No hay seguimientos registrados para este caso.<br/>Haz clic en "Agregar Seguimiento" para comenzar.
              </div>
            ) : (
              <div className="space-y-4">
                {[...gestiones].reverse().map(g => {
                  const ga = g.attributes;
                  const dExtra = ga.datos_adicionales || {};
                  const creadorSeg = ga.creador_seguimiento?.[0] || {};
                  
                  return (
                    <div key={g.id} className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow relative">
                      
                      <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <AvatarInline src={creadorSeg.foto} name={creadorSeg.nombre} size={36} />
                          <div>
                            <div className="text-sm font-bold text-gray-800">{creadorSeg.nombre || "Usuario SST"}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                              {fmtDate(ga.fecha_creacion_manual)} 
                              {ga.temporalidad && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">Vence: {fmtDate(ga.temporalidad)}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button className="text-[11px] px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition-colors" onClick={() => editGestion(g)}>Editar</button>
                          <button className="text-[11px] px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded transition-colors" onClick={(e) => deleteGestion(g.id, e)}>Eliminar</button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="inline-block px-2.5 py-1 bg-gray-800 text-white text-xs font-bold rounded-md">
                          {ga.accion_realizada?.replace(/_/g, " ")}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
                        {ga.sistema_afectado && <div className="flex flex-col"><span className="text-xs text-gray-400">Sistema Afectado</span><span className="font-medium text-gray-800">{ga.sistema_afectado}</span></div>}
                        {dExtra.segmento_corporal && <div className="flex flex-col"><span className="text-xs text-gray-400">Segmento Corporal</span><span className="font-medium text-gray-800">{dExtra.segmento_corporal}</span></div>}
                        {dExtra.hemicuerpo_afectado && <div className="flex flex-col"><span className="text-xs text-gray-400">Hemicuerpo</span><span className="font-medium text-gray-800">{dExtra.hemicuerpo_afectado}</span></div>}
                        {dExtra.criticidad_sve && <div className="flex flex-col"><span className="text-xs text-gray-400">Criticidad SVE</span><span className="font-medium text-gray-800">{dExtra.criticidad_sve}</span></div>}
                        
                        {/* Peso y Talla */}
                        {(ga.peso_kg || ga.talla_m) && (
                           <div className="flex flex-col md:col-span-2">
                             <span className="text-xs text-gray-400">Biometría</span>
                             <span className="font-medium text-gray-800">
                               {ga.peso_kg ? `Peso: ${ga.peso_kg}kg ` : ""}
                               {ga.talla_m ? `Talla: ${ga.talla_m}m` : ""}
                             </span>
                           </div>
                        )}

                        {ga.codigo_cie && <div className="flex flex-col md:col-span-2 mt-1"><span className="text-xs text-gray-400">Diagnóstico CIE-10</span><span className="font-medium text-gray-800">{ga.codigo_cie} — {ga.diagnostico_cie}</span></div>}
                        {ga.diagnostico_sst && <div className="flex flex-col md:col-span-2 mt-1"><span className="text-xs text-gray-400">Diagnóstico SST</span><span className="font-medium text-gray-800">{ga.diagnostico_sst}</span></div>}
                      </div>

                      {ga.descripcion && (
                        <div className="text-sm text-gray-700 bg-blue-50/30 p-3 rounded-lg border border-blue-50 italic">
                          "{ga.descripcion}"
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