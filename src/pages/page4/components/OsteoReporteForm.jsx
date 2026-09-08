import { useState } from "react";

const API_EMPLEADOS = import.meta.env.VITE_API_EMPLEADO;
const API_REPORTES = import.meta.env.VITE_API_REPORTE;

const AvatarInline = ({ src, name, size = 30 }) => (
  src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1px solid #e5e7eb" }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontWeight: "bold", fontSize: size * 0.4, border: "1px solid #e5e7eb" }}>
      {name ? name.charAt(0).toUpperCase() : "?"}
    </div>
  )
);

function CollabSelector({ equipo, onSelect, selected }) {
  const [search, setSearch] = useState("");
  const [apiResult, setApiResult] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function fetchFullEmployee(doc) {
    setApiLoading(true); setApiError("");
    try {
      const res = await fetch(`${API_EMPLEADOS}?documento=${doc}`);
      const json = await res.json();
      if (json.ok && json.data?.length) {
        return json.data[0];
      } else {
        setApiError("No se encontraron detalles completos del empleado.");
      }
    } catch {
      setApiError("Error de conexión al consultar empleado.");
    } finally {
      setApiLoading(false);
    }
    return null;
  }

  async function searchByDoc() {
    if (!search.trim()) return;
    setApiResult(null);
    const emp = await fetchFullEmployee(search.trim());
    if (emp) setApiResult(emp);
  }

  async function handleSelect(collabItem) {
    if (collabItem.ciudad !== undefined && collabItem.direction !== undefined) {
      onSelect(collabItem);
    } else {
      const fullEmp = await fetchFullEmployee(collabItem.document_number);
      onSelect(fullEmp || collabItem);
    }
  }

  const filtered = equipo?.filter(e =>
    !search || e.nombre?.toLowerCase().includes(search.toLowerCase()) || String(e.document_number).includes(search)
  ) || [];

  return (
    <div>
      <div className="flex gap-2 mb-2 p-1">
        <input className="flex-1 p-2 border border-gray-300 rounded text-sm outline-none" placeholder="Buscar por nombre o CC..." value={search} onChange={e => { setSearch(e.target.value); setApiResult(null); setApiError(""); }} />
        <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50" onClick={searchByDoc} disabled={apiLoading}>{apiLoading ? "..." : "Buscar CC"}</button>
      </div>
      {apiError && <div className="text-xs text-red-500 mb-2">{apiError}</div>}
      <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
        {apiResult && (
          <div className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer bg-teal-50" onClick={() => handleSelect(apiResult)}>
            <AvatarInline src={apiResult.foto} name={apiResult.nombre} size={30} />
            <div><div className="font-semibold text-sm">{apiResult.nombre}</div><div className="text-xs text-gray-500">{apiResult.document_number} · {apiResult.cargo}</div></div>
          </div>
        )}
        {filtered.map(e => (
          <div key={e.document_number} className={`flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer ${selected?.document_number === e.document_number ? "bg-teal-50" : ""}`} onClick={() => handleSelect(e)}>
            <AvatarInline src={e.foto} name={e.nombre} size={30} />
            <div><div className="font-semibold text-sm">{e.nombre}</div><div className="text-xs text-gray-500">{e.document_number}</div></div>
          </div>
        ))}
        {!filtered.length && !apiResult && <div className="p-3 text-xs text-gray-400 text-center">Sin resultados. Busca por CC arriba.</div>}
      </div>
    </div>
  );
}

export default function OsteoReporteForm({ equipo, user, onClose, onSaved }) {
  const [collab, setCollab] = useState(null);
  const [form, setForm] = useState({ 
    categoria: "", 
    fecha: new Date().toISOString().split("T")[0], 
    tipo_entidad: "", 
    nombre_entidad: "", 
    descripcion: "" 
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function submit() {
    if (!collab) { setError("Selecciona un colaborador."); return; }
    // Retiramos la validación del género ya que ahora viene automático
    if (!form.categoria || !form.tipo_entidad) { setError("Completa los campos obligatorios."); return; }
    
    setSaving(true); 
    setError("");

    try {
      

      const payloadData = {
        categoria: form.categoria, 
        tipo_entidad: form.tipo_entidad, 
        nombre_entidad: form.nombre_entidad, 
        descripcion: form.descripcion, 
        estado: "abierto", 
        tipo_caso: "osteomuscular",
        fecha_creacion_manual: form.fecha, 
        
        // Data del colaborador traída de Buk (empleados3)
        colaborador: [{
          nombre: collab.nombre || null,
          documento: String(collab.document_number) || null,
          celular: collab.Celular || null,
          correo: collab.correo || null,
          foto: collab.foto || "",
          ciudad: collab.ciudad || null,
          cargo: collab.cargo || null,
          area: collab.area_nombre || null,
          departamento: collab.departamento || null,
          direccion: collab.direction || null,
          nacimiento: collab.birthday || null,
          antiguedad: collab.ingreso || null,
          genero: collab.gender || null 
        }],
        
        // Data del líder (quien reporta)
        creador: [{
          nombre: user.nombre,
          documento: String(user.document_number) || "",
          foto: user.foto || ""
        }]
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payloadData));

      if (file) {
        formData.append("files.adjuntos", file); 
      }

      const res = await fetch(API_REPORTES, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || "Error guardando reporte");
      }

      onSaved();
    } catch (e) { 
      setError(e.message); 
    }
    setSaving(false);
  }
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 my-auto relative animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Nuevo Reporte Osteomuscular</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Colaborador *</label>
          <CollabSelector equipo={equipo} onSelect={setCollab} selected={collab} />
          {collab && (
            <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-100 rounded-md mt-3 text-sm">
              <AvatarInline src={collab.foto} name={collab.nombre} size={32} />
              <div className="flex flex-col">
                <span className="font-semibold text-teal-900">{collab.nombre}</span>
                <span className="text-teal-700">· CC: {collab.document_number} {collab.gender ? `· Sexo: ${collab.gender}` : ''}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Categoría del Evento *</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.categoria} onChange={e => set("categoria", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="Reincorporacion Postincapacidad">Reincorporación Postincapacidad</option>
              <option value="Recomendaciones Medicas">Recomendaciones Médicas</option>
              <option value="Recomendaciones Nutricionales">Recomendaciones Nutricionales</option>
              <option value="Incapacidades Recurrentes">Incapacidades Recurrentes</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Tipo de Entidad *</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.tipo_entidad} onChange={e => set("tipo_entidad", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="EPS">EPS</option>
              <option value="ARL">ARL</option>
              <option value="Medicina Prepagada">Medicina Prepagada</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Fecha de Creación</label>
            <input type="date" className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Nombre de la Entidad</label>
            <input className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" placeholder="Ej: Sanitas..." value={form.nombre_entidad} onChange={e => set("nombre_entidad", e.target.value)} />
          </div>

          <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Descripción Detallada</label>
            <textarea className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" rows={3} placeholder="Describa la situación..." value={form.descripcion} onChange={e => set("descripcion", e.target.value)} />
          </div>
          <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Adjuntar Documento</label>
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-md text-center text-sm text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => document.getElementById("file-inp").click()}>
              {file ? file.name : "Haz clic para adjuntar archivo"}
            </div>
            <input id="file-inp" type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>

        {error && <div className="mt-4 p-2 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">{error}</div>}
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors" onClick={onClose}>Cancelar</button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50" onClick={submit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Reporte"}
          </button>
        </div>
      </div>
    </div>
  );
}