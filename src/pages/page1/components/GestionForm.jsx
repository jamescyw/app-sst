import { useState, useRef } from "react";

const API_CIE = import.meta.env.VITE_API_CIE;
const API_GESTIONES = import.meta.env.VITE_API_GESTION_SG;
const API_REPORTES = import.meta.env.VITE_API_REPORTE_SG;

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
      <input className="form-control" placeholder="Buscar código CIE-10..." value={query} onChange={e => search(e.target.value)} onFocus={() => results.length && setOpen(true)} />
      {open && results.length > 0 && (
        <div className="cie-dropdown">
          {results.map(r => (
            <div key={r.id} className="cie-item" onClick={() => select(r)}>
              <strong>{r.attributes.codigo}</strong> — {r.attributes.descripcion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GestionForm({ user, reporteId, gestionToEdit, onClose, onSaved }) {

  console.log("Datos del usuario logueado:", user);
  
  const [form, setForm] = useState(
    gestionToEdit ? {
      fecha_hora: gestionToEdit.attributes.fecha_hora,
      temporalidad: gestionToEdit.attributes.temporalidad || "",
      accion_realizada: gestionToEdit.attributes.accion_realizada || "",
      sistema_afectado: gestionToEdit.attributes.sistema_afectado || "",
      estado_registrado: gestionToEdit.attributes.estado_registrado || "seguimiento",
      peso_kg: gestionToEdit.attributes.peso_kg || "",
      talla_m: gestionToEdit.attributes.talla_m || "",
      diagnostico: gestionToEdit.attributes.diagnostico || "",
      descripcion: gestionToEdit.attributes.descripcion || "",
      diagnostico_sst: gestionToEdit.attributes.diagnostico_sst || "",
    } : { 
      fecha_hora: new Date().toISOString().split("T")[0], 
      temporalidad: "", 
      accion_realizada: "", 
      sistema_afectado: "", 
      estado_registrado: "seguimiento",
      peso_kg: "", 
      talla_m: "", 
      diagnostico: "", 
      descripcion: "" ,
      diagnostico_sst: "",
    }
  );
  
  const [cie, setCie] = useState(
    gestionToEdit?.attributes.categoria_cie 
      ? { codigo: gestionToEdit.attributes.categoria_cie, descripcion: gestionToEdit.attributes.diagnostico } 
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

      const resGestion = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data: { 
            creador: user?.nombre || "Usuario", 
            fecha_hora: form.fecha_hora,
            temporalidad: form.temporalidad || null, 
            accion_realizada: form.accion_realizada, 
            sistema_afectado: form.sistema_afectado, 
            estado_registrado: form.estado_registrado, 
            peso_kg: form.peso_kg ? parseFloat(form.peso_kg) : null, 
            talla_m: form.talla_m ? parseFloat(form.talla_m) : null, 
            categoria_cie: cie?.codigo || null, 
            diagnostico: cie?.descripcion || form.diagnostico, 
            descripcion: form.descripcion, 
            diagnostico_sst: form.diagnostico_sst || null,
            sstreporte: reporteId 
          } 
        }),
      });

      if (!resGestion.ok) throw new Error("Error guardando gestión.");

      await fetch(`${API_REPORTES}/${reporteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { estado: form.estado_registrado } })
      });

      onSaved();
    } catch (e) { setError(e.message); }
    setSaving(false);
  }

 return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 my-8 relative animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">{gestionToEdit ? "Editar Seguimiento" : "Nuevo Seguimiento"}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1"><label className="text-sm font-semibold text-gray-700">Fecha</label><input type="date" className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.fecha_hora} onChange={e => set("fecha_hora", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-semibold text-gray-700">Temporalidad (Vence)</label><input type="date" className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.temporalidad} onChange={e => set("temporalidad", e.target.value)} /></div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Acción Realizada *</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.accion_realizada} onChange={e => set("accion_realizada", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="Compromiso de Autocuidado">Compromiso de Autocuidado</option>
              <option value="Acta de Seguimiento">Acta de Seguimiento</option>
              <option value="Autorización de Lonchera">Autorización de Lonchera</option>
              <option value="Reincorporación Laboral">Reincorporación Laboral</option>
              <option value="Cierre de Reincorporación">Cierre de Reincorporación</option>
              <option value="Seguimiento">Seguimiento</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Sistema Afectado</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.sistema_afectado} onChange={e => set("sistema_afectado", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Dermatologico">Dermatologico</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
              <option value="Genitourinario">Genitourinario</option>
              <option value="Inmunologico">Inmunologico</option>
              <option value="Neurologico">Neurologico</option>
              <option value="Respiratorio">Respiratorio</option>
              <option value="Alimenticio">Alimenticio</option>
              <option value="Neoplasias">Neoplasias</option>
              <option value="Auditivo">Auditivo</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Actualizar Estado</label>
            <select className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" value={form.estado_registrado} onChange={e => set("estado_registrado", e.target.value)}>
              <option value="seguimiento">En Seguimiento</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1"><label className="text-sm font-semibold text-gray-700">Peso (Kg)</label><input type="number" className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" placeholder="60" value={form.peso_kg} onChange={e => set("peso_kg", e.target.value)} /></div>
            <div className="flex flex-col gap-1 flex-1"><label className="text-sm font-semibold text-gray-700">Talla (M)</label><input type="number" className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" placeholder="1.70" step="0.01" value={form.talla_m} onChange={e => set("talla_m", e.target.value)} /></div>
          </div>
          
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Código CIE-10</label>
            <CieSearch value={cie} onSelect={c => { setCie(c); set("diagnostico", c.descripcion); }} />
          </div>
          
          <div className="flex flex-col gap-1 md:col-span-2"><label className="text-sm font-semibold text-gray-700">Diagnóstico</label><input className="p-2 border border-gray-200 bg-gray-50 rounded-md text-sm outline-none" disabled value={form.diagnostico} onChange={e => set("diagnostico", e.target.value)} placeholder="Auto desde CIE-10..." /></div>
          <div className="flex flex-col gap-1 md:col-span-2"><label className="text-sm font-semibold text-gray-700">Diagnóstico SST</label><textarea className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" rows={2} placeholder="Descripción del diagnóstico..." value={form.diagnostico_sst} onChange={e => set("diagnostico_sst", e.target.value)} /></div>
          <div className="flex flex-col gap-1 md:col-span-2"><label className="text-sm font-semibold text-gray-700">Observaciones</label><textarea className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" rows={2} placeholder="Notas adicionales..." value={form.descripcion} onChange={e => set("descripcion", e.target.value)} /></div>
        </div>

        {error && <div className="mt-4 p-2 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">{error}</div>}
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors" onClick={onClose}>Cancelar</button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50" onClick={submit} disabled={saving}>{saving ? "Guardando..." : "Guardar Gestión"}</button>
        </div>
      </div>
    </div>
  );
}