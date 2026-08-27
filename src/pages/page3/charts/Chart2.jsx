import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export default function Chart2({ data, labelAnio1, labelAnio2 }) {
  const top10Data = useMemo(() => {
    if (!data || data.length === 0) return [];
    const sorted = [...data].sort((a, b) => b.casosAnio2 - a.casosAnio2).slice(0, 10);

    return sorted.map(item => {
      const variacion = item.casosAnio2 - item.casosAnio1;
      let tendencia = 'Igual';
      let colorTendencia = 'text-gray-500';
      let iconoTendencia = '➖';

      if (variacion > 0) {
        tendencia = 'Aumenta';
        colorTendencia = 'text-red-500';
        iconoTendencia = '⬆️';
      } else if (variacion < 0) {
        tendencia = 'Disminuye';
        colorTendencia = 'text-green-500';
        iconoTendencia = '⬇️';
      }

      return { ...item, variacion, tendencia, colorTendencia, iconoTendencia };
    });
  }, [data]);

  const chartOptions = useMemo(() => {
    const reversedData = [...top10Data].reverse();
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: [labelAnio1, labelAnio2], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '5%', containLabel: true },
      xAxis: { type: 'value', name: 'Casos' },
      yAxis: {
        type: 'category',
        data: reversedData.map(d => d.tipo),
        axisLabel: { width: 150, overflow: 'truncate', fontSize: 11 }
      },
      series: [
        {
          name: labelAnio1,
          type: 'bar',
          data: reversedData.map(d => d.casosAnio1),
          itemStyle: { color: '#94a3b8' }
        },
        {
          name: labelAnio2,
          type: 'bar',
          data: reversedData.map(d => d.casosAnio2),
          itemStyle: { color: '#3b82f6' }
        }
      ]
    };
  }, [top10Data, labelAnio1, labelAnio2]);

  if (!data || data.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-center items-center h-64 text-gray-500">No hay datos registrados.</div>;
  }

  return (
    <div className="flex flex-col gap-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800">Tipos de Incapacidad</h2>
      <div className="w-full h-[400px]">
        <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 border-b">
              <th className="p-3 font-semibold">Tipo</th>
              <th className="p-3 font-semibold text-center">Casos {labelAnio1}</th>
              <th className="p-3 font-semibold text-center">Casos {labelAnio2}</th>
              <th className="p-3 font-semibold text-center">Variación</th>
              <th className="p-3 font-semibold text-center">Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {top10Data.map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-3 text-gray-800 font-medium truncate max-w-xs" title={row.tipo}>{row.tipo}</td>
                <td className="p-3 text-center text-gray-600">{row.casosAnio1}</td>
                <td className="p-3 text-center text-gray-900 font-bold">{row.casosAnio2}</td>
                <td className={`p-3 text-center font-bold ${row.colorTendencia}`}>{row.variacion > 0 ? '+' : ''}{row.variacion}</td>
                <td className={`p-3 text-center font-medium ${row.colorTendencia}`}>
                  <span className="mr-1">{row.iconoTendencia}</span>{row.tendencia}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}