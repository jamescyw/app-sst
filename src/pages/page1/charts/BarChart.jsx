import ReactECharts from "echarts-for-react";

export default function BarChart({ title, data = [], color = "var(--teal)" }) {
  const safeData = Array.isArray(data) ? data : [];
  const chartData = safeData.map((d) => ({
    value: Number(d.count) || 0,
    name: d.label || "Sin etiqueta",
  }));

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    // Ajustamos los márgenes; containLabel asegura que los textos del eje Y no se corten
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: "value", // El eje X ahora maneja los valores numéricos
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#E5E7EB" } },
    },
    yAxis: {
      type: "category", // El eje Y ahora maneja los nombres/categorías
      inverse: true, // Esto asegura que el primer dato aparezca en la parte superior
      data: chartData.map((d) => d.name),
      axisLabel: {
        interval: 0,
        fontSize: 10,
        color: "#4B5563",
        // Propiedades para truncar textos largos (Soportado nativamente en ECharts 5.0+)
        width: 100, 
        overflow: "truncate",
        // Formatter de respaldo para añadir "..." en caso de usar una versión antigua
        formatter: function (value) {
          return value.length > 16 ? value.substring(0, 16) + "..." : value;
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: chartData.map((d) => ({ value: d.value, name: d.name })),
        itemStyle: {
          color: color,
          // Ajustamos el border radius para barras horizontales [arriba-der, abajo-der, abajo-izq, arriba-izq]
          borderRadius: [0, 6, 6, 0],
        },
        barMaxWidth: 36,
      },
    ],
  };

  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      {safeData.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--gray-400)", paddingTop: 8 }}>Sin datos</div>
      ) : (
        <ReactECharts
          option={option}
          style={{ height: 220, width: "100%" }}
          notMerge
          lazyUpdate
        />
      )}
    </div>
  );
}