import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CircleArrowDown, CircleArrowUp, CircleMinus } from 'lucide-react';

export default function Chart4({ data, labelAnio1, labelAnio2 }) {
  const top10Data = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sorted = [...data].sort((a, b) => b.casosAnio2 - a.casosAnio2).slice(0, 10);

    return sorted.map(item => {
      const variacion = item.casosAnio2 - item.casosAnio1;
      let colorTendencia = 'text-gray-500';
      let iconoTendencia = <CircleMinus size={16} />;

      if (variacion > 0) {
        colorTendencia = 'text-red-500';
        iconoTendencia = <CircleArrowUp size={16} />;
      } else if (variacion < 0) {
        colorTendencia = 'text-green-500';
        iconoTendencia = <CircleArrowDown size={16} />;
      }

      return {
        ...item,
        variacion,
        colorTendencia,
        iconoTendencia
      };
    });
  }, [data]);

  const chartOptions = useMemo(() => {
    const reversedData = [...top10Data].reverse();

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: [labelAnio1, labelAnio2],
        bottom: 0
      },
      grid: {
        left: '0',
        right: '1%',
        bottom: '10%',
        top: '0',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: ''
      },
      yAxis: {
        type: 'category',
        data: reversedData.map(d => d.rangoEdad),
        axisLabel: {
          width: 150, 
          overflow: 'truncate',
          fontSize: 11
        }
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
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-center items-center h-64 text-gray-500">
        No hay datos registrados para los años seleccionados ({labelAnio1} - {labelAnio2}).
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-center">
        Incapacidades por Rango de Edad
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="w-full h-[400px]">
          <ReactECharts 
            option={chartOptions} 
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-2 font-semibold">Rango de Edad</th>
                <th className="p-2 font-semibold text-center">Casos {labelAnio1}</th>
                <th className="p-2 font-semibold text-center">Casos {labelAnio2}</th>
                <th className="p-2 font-semibold text-center">Variación</th>
              </tr>
            </thead>
            <tbody>
              {top10Data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors last:border-0">
                  <td className="p-2 text-gray-600 truncate max-w-[150px]" title={row.rangoEdad}>
                    {row.rangoEdad}
                  </td>
                  <td className="p-2 text-center text-gray-600">{row.casosAnio1}</td>
                  <td className="p-2 text-center text-gray-600">{row.casosAnio2}</td>
                  <td className={`p-2 font-bold ${row.colorTendencia}`}>
                    <div className="flex items-center justify-center gap-1">
                      {row.variacion > 0 ? '+' : ''}{row.variacion}
                      {row.iconoTendencia}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>
  );
}