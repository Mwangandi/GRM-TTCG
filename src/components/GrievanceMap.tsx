import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const WARDS = [
  { name: 'Taveta', x: 20, y: 80 },
  { name: 'Mboghoni', x: 15, y: 60 },
  { name: 'Chala', x: 25, y: 40 },
  { name: 'Bura', x: 50, y: 40 },
  { name: 'Wumingu', x: 60, y: 20 },
  { name: 'Mwatate', x: 60, y: 60 },
  { name: 'Voi', x: 85, y: 55 }
];

export function GrievanceMap({ activeWard }: { activeWard?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 300;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const xScale = d3.scaleLinear().domain([0, 100]).range([30, width - 30]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([30, height - 30]);

    // Draw some connection lines to simulate a map structure
    const links = [
      ['Taveta', 'Mboghoni'], ['Mboghoni', 'Chala'], ['Chala', 'Bura'],
      ['Bura', 'Mwatate'], ['Bura', 'Wumingu'], ['Mwatate', 'Voi'], ['Wumingu', 'Voi']
    ];

    links.forEach(([source, target]) => {
      const s = WARDS.find(w => w.name === source);
      const t = WARDS.find(w => w.name === target);
      if (s && t) {
        svg.append('line')
          .attr('x1', xScale(s.x))
          .attr('y1', yScale(s.y))
          .attr('x2', xScale(t.x))
          .attr('y2', yScale(t.y))
          .attr('stroke', '#e2e8f0') // slate-200
          .attr('stroke-width', 2);
      }
    });

    const nodes = svg.selectAll('g')
      .data(WARDS)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${xScale(d.x)},${yScale(d.y)})`);

    nodes.append('circle')
      .attr('r', d => d.name === activeWard ? 12 : 8)
      .attr('fill', d => d.name === activeWard ? '#10b981' : '#cbd5e1') // emerald-500 or slate-300
      .attr('stroke', d => d.name === activeWard ? '#059669' : '#94a3b8')
      .attr('stroke-width', 2);

    if (activeWard) {
      nodes.filter(d => d.name === activeWard)
        .append('circle')
        .attr('r', 18)
        .attr('fill', 'none')
        .attr('stroke', '#34d399')
        .attr('stroke-width', 2)
        .style('opacity', 0.5)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '12;24')
        .attr('dur', '1.5s')
        .attr('repeatCount', 'indefinite');
        
      nodes.filter(d => d.name === activeWard)
        .select('line') // We actually appended an animate above, not line... wait, animate attribute is for SVG animate tag.
    }

    nodes.append('text')
      .text(d => d.name)
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', d => d.name === activeWard ? '14px' : '12px')
      .attr('font-weight', d => d.name === activeWard ? 'bold' : 'normal')
      .attr('fill', d => d.name === activeWard ? '#0f766e' : '#64748b');

  }, [activeWard]);

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
      <h4 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-4 text-center">
        Origin Map (Taita Taveta)
      </h4>
      <div className="flex justify-center items-center">
        <svg ref={svgRef} className="w-full h-auto max-w-sm"></svg>
      </div>
      {activeWard ? (
        <p className="text-center text-sm text-slate-500 mt-2">
          Originating from <span className="font-semibold text-emerald-600">{activeWard}</span> ward.
        </p>
      ) : (
        <p className="text-center text-sm text-slate-500 mt-2">
          Location not specified
        </p>
      )}
    </div>
  );
}
