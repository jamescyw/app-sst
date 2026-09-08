import { useState, useRef } from "react";

const API_CIE = import.meta.env.VITE_API_CIE;
const API_GESTIONES = import.meta.env.VITE_API_GESTION; 
const API_REPORTES = import.meta.env.VITE_API_REPORTE; 

function CieSearch({ value, onSelect }) {
  const [query, setQuery] = useState(value?.codigo || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef();

  function search(q) {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (!q || q.length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_CIE}?filters[codigo][$containsi]=${q}`);
        const json = await res.json();
        if (json.data && json.data.length > 0) { setResults(json.data); setOpen(true); }
        else {
          const res2 = await fetch(`${API_CIE}?filters[descripcion][$containsi]=${q}&pageSize=20`);
          const json2 = await res2.json();
          setResults(json2.data || []); setOpen(true);
        }
      } catch { setResults([]); }
    }, 350);
  }

  function select(item) {
    setQuery(item.attributes.codigo + " - " + item.attributes.descripcion);
    setOpen(false);
    onSelect({ codigo: item.attributes.codigo, descripcion: item.attributes.descripcion });
  }

  return (
    <div style={{ position: "relative" }}>
      <input className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" placeholder="Buscar código CIE-10..." value={query} onChange={e => search(e.target.value)} onFocus={() => results.length && setOpen(true)} />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {results.map(r => (
            <div key={r.id} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => select(r)}>
              <strong>{r.attributes.codigo}</strong> — {r.attributes.descripcion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OsteoGestionForm({ user, reporteId, gestionToEdit, onClose, onSaved }) {
  
  const dExtra = gestionToEdit?.attributes?.datos_adicionales || {};

  const [form, setForm] = useState(
    gestionToEdit ? {
      fecha_creacion_manual: gestionToEdit.attributes.fecha_creacion_manual,
      temporalidad: gestionToEdit.attributes.temporalidad || "",
      accion_realizada: gestionToEdit.attributes.accion_realizada || "",
      sistema_afectado: gestionToEdit.attributes.sistema_afectado || "",
      estado: gestionToEdit.attributes.estado || "seguimiento",
      diagnostico_cie: gestionToEdit.attributes.diagnostico_cie || "",
      descripcion: gestionToEdit.attributes.descripcion || "",
      diagnostico_sst: gestionToEdit.attributes.diagnostico_sst || "",
      peso_kg: gestionToEdit.attributes.peso_kg || "",
      talla_m: gestionToEdit.attributes.talla_m || "",
      segmento_corporal: dExtra.segmento_corporal || "",
      hemicuerpo_afectado: dExtra.hemicuerpo_afectado || "",
      criticidad_sve: dExtra.criticidad_sve || "",
    } : { 
      fecha_creacion_manual: new Date().toISOString().split("T")[0], 
      temporalidad: "", 
      accion_realizada: "", 
      sistema_afectado: "",
      estado: "seguimiento",
      diagnostico_cie: "", 
      descripcion: "" ,
      diagnostico_sst: "",
      peso_kg: "",
      talla_m: "",
      segmento_corporal: "",
      hemicuerpo_afectado: "",
      criticidad_sve: "",
    }
  );
  
  const [cie, setCie] = useState(
    gestionToEdit?.attributes.codigo_cie 
      ? { codigo: gestionToEdit.attributes.codigo_cie, descripcion: gestionToEdit.attributes.diagnostico_cie } 
      : null
  );
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function submit() {
    if (!form.accion_realizada) { setError("Selecciona una acción realizada."); return; }
    setSaving(true); setError("");
    try {
      const isEditing = !!gestionToEdit;
      const method = isEditing ? "PUT" : "POST";
      const endpoint = isEditing ? `${API_GESTIONES}/${gestionToEdit.id}` : API_GESTIONES;

      const payload = {
        data: {
          fecha_creacion_manual: form.fecha_creacion_manual,
          temporalidad: form.temporalidad || null, 
          accion_realizada: form.accion_realizada, 
          sistema_afectado: form.sistema_afectado || null, 
          estado: form.estado, 
          codigo_cie: cie?.codigo || null, 
          diagnostico_cie: cie?.descripcion || form.diagnostico_cie, 
          descripcion: form.descripcion, 
          diagnostico_sst: form.diagnostico_sst || null,
          peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
          talla_m: form.talla_m ? Number(form.talla_m) : null,
          sst_reports_web: reporteId,
          creador_seguimiento: [{ 
            nombre: user?.nombre || "Usuario SST", 
            documento: String(user?.document_number || ""), 
            foto: user?.foto || "" 
          }],
          datos_adicionales: {
            segmento_corporal: form.segmento_corporal,
            hemicuerpo_afectado: form.hemicuerpo_afectado,
            criticidad_sve: form.criticidad_sve
          }
        }
      };

      const resGestion = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resGestion.ok) throw new Error("Error guardando gestión.");

      await fetch(`${API_REPORTES}/${reporteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { estado: form.estado } })
      });

      onSaved();
    } catch (e) { setError(e.message); }
    setSaving(false);
  }

 return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 my-8 relative animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">{gestionToEdit ? "Editar Seguimiento" : "Nuevo Seguimiento"}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1"><label className="text-sm font-semibold text-gray-700">Fecha</label><input type="date" className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.fecha_creacion_manual} onChange={e => set("fecha_creacion_manual", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-semibold text-gray-700">Temporalidad (Vence)</label><input type="date" className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.temporalidad} onChange={e => set("temporalidad", e.target.value)} /></div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Actualizar Estado</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.estado} onChange={e => set("estado", e.target.value)}>
              <option value="seguimiento">En Seguimiento</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-sm font-semibold text-gray-700">Acción Realizada *</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.accion_realizada} onChange={e => set("accion_realizada", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="Compromiso de Autocuidado">Compromiso de Autocuidado</option>
              <option value="Acta de Seguimiento">Acta de Seguimiento</option>
              <option value="Reincorporación Laboral">Reincorporación Laboral</option>
              <option value="Cierre de Reincorporación">Cierre de Reincorporación</option>
              <option value="Seguimiento">Seguimiento</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 md:col-span-1">
             <label className="text-sm font-semibold text-gray-700">Peso (Kg)</label>
             <input type="number" step="0.1" className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" placeholder="Ej: 75.5" value={form.peso_kg} onChange={e => set("peso_kg", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
             <label className="text-sm font-semibold text-gray-700">Talla (m)</label>
             <input type="number" step="0.01" className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" placeholder="Ej: 1.75" value={form.talla_m} onChange={e => set("talla_m", e.target.value)} />
          </div>

          {/* CAMPOS ESPECÍFICOS OSTEOMUSCULAR */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Sistema Afectado</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.sistema_afectado} onChange={e => set("sistema_afectado", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="cardiovascular">Cardiovascular</option>
              <option value="osteomuscular">Osteomuscular</option>
              <option value="respiratorio">Respiratorio</option>
              <option value="auditivo">Auditivo</option>
              <option value="visual">Visual</option>
              <option value="psicosocial">Psicosocial</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Segmento Corporal</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.segmento_corporal} onChange={e => set("segmento_corporal", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="hombro">Hombro</option>
              <option value="codo">Codo</option>
              <option value="mano">Mano</option>
              <option value="columna cervical">Columna cervical</option>
              <option value="columna dorsal">Columna dorsal</option>
              <option value="columna lumbar">Columna lumbar</option>
              <option value="cadera">Cadera</option>
              <option value="rodilla">Rodilla</option>
              <option value="pie">Pie</option>
              <option value="dedos mano">Dedos mano</option>
              <option value="dedos pie">Dedos pie</option>
              <option value="cuello de pie">Cuello de pie</option>
              <option value="tronco">Tronco</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Hemicuerpo Afectado</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.hemicuerpo_afectado} onChange={e => set("hemicuerpo_afectado", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="izquierda">Izquierda</option>
              <option value="derecha">Derecha</option>
              <option value="bilateral">Bilateral</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">Criticidad según SVE</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 md:w-1/3" value={form.criticidad_sve} onChange={e => set("criticidad_sve", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="no caso">No caso</option>
              <option value="caso sintomatico">Caso sintomático</option>
              <option value="caso probable">Caso probable</option>
              <option value="caso confirmado">Caso confirmado</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1 md:col-span-3 mt-2 border-t pt-4">
            <label className="text-sm font-semibold text-gray-700">Código CIE-10</label>
            <CieSearch value={cie} onSelect={c => { setCie(c); set("diagnostico_cie", c.descripcion); }} />
          </div>
          
          <div className="flex flex-col gap-1 md:col-span-3"><label className="text-sm font-semibold text-gray-700">Diagnóstico CIE</label><input className="p-2 border border-gray-200 bg-gray-50 rounded-md text-sm outline-none" disabled value={form.diagnostico_cie} onChange={e => set("diagnostico_cie", e.target.value)} placeholder="Auto desde CIE-10..." /></div>
          <div className="flex flex-col gap-1 md:col-span-3"><label className="text-sm font-semibold text-gray-700">Diagnóstico SST</label><textarea className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" rows={2} placeholder="Descripción clínica del diagnóstico..." value={form.diagnostico_sst} onChange={e => set("diagnostico_sst", e.target.value)} /></div>
          <div className="flex flex-col gap-1 md:col-span-3"><label className="text-sm font-semibold text-gray-700">Observaciones y Desarrollo</label><textarea className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" rows={3} placeholder="Notas de la consulta, recomendaciones, etc..." value={form.descripcion} onChange={e => set("descripcion", e.target.value)} /></div>
        </div>

        {error && <div className="mt-4 p-2 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">{error}</div>}
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors" onClick={onClose}>Cancelar</button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50" onClick={submit} disabled={saving}>{saving ? "Guardando..." : "Guardar Gestión"}</button>
        </div>
      </div>
    </div>
  );
}