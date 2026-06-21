import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Grievance, Category } from '../types';

interface DepartmentHeatmapProps {
  grievances: Grievance[];
}

interface HeatmapData {
  department: string;
  category: string;
  avgTimeDays: number;
  count: number;
}

export function DepartmentHeatmap({ grievances }: DepartmentHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedData = useMemo(() => {
    const categoriesSet = new Set<string>();
    const departmentsSet = new Set<string>();
    
    const records = grievances.filter(g => g.status === 'Case Closed' && g.resolutionDate && g.assignedDepartment);
    
    // Group records by Dept -> Cat
    const grouped = new Map<string, Array<{time: number}>>();

    records.forEach(g => {
        const d = g.assignedDepartment!;
        const c = g.category;
        categoriesSet.add(c);
        departmentsSet.add(d);

        const deptCatKey = `${d}||${c}`;
        if (!grouped.has(deptCatKey)) grouped.set(deptCatKey, []);
        
        const submitted = new Date(g.dateSubmitted).getTime();
        const resolved = new Date(g.resolutionDate!).getTime();
        const days = (resolved - submitted) / (1000 * 60 * 60 * 24);
        grouped.get(deptCatKey)!.push({time: days});
    });

    const result: HeatmapData[] = [];
    departmentsSet.forEach(d => {
        categoriesSet.forEach(c => {
            const key = `${d}||${c}`;
            const entries = grouped.get(key);
            if (entries && entries.length > 0) {
                const total = entries.reduce((sum, item) => sum + item.time, 0);
                result.push({
                    department: d,
                    category: c,
                    avgTimeDays: total / entries.length,
                    count: entries.length
                });
            } else {
                result.push({
                    department: d,
                    category: c,
                    avgTimeDays: -1, // Use -1 to indicate no data
                    count: 0
                });
            }
        });
    });

    return {
        data: result,
        categories: Array.from(categoriesSet).sort(),
        departments: Array.from(departmentsSet).sort()
    };
  }, [grievances]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    
    const { data, categories, departments } = parsedData;

    if (departments.length === 0 || categories.length === 0) {
        return; // No resolved data to show
    }

    const containerWidth = containerRef.current.clientWidth;
    const margin = { top: 30, right: 30, bottom: 80, left: 200 };
    const width = containerWidth - margin.left - margin.right;
    
    // Calculate a good height based on departments
    const height = Math.max(200, departments.length * 40);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Build X scales and axis:
    const x = d3.scaleBand()
      .range([0, width])
      .domain(categories)
      .padding(0.05);
      
    g.append("g")
      .style("font-size", 12)
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select(".domain").remove();
      
    // Rotate x-axis text
    g.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("fill", "#64748b");

    // Build Y scales and axis:
    const y = d3.scaleBand()
      .range([height, 0])
      .domain(departments)
      .padding(0.05);
      
    g.append("g")
      .style("font-size", 12)
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();
      
    g.selectAll(".tick text").style("fill", "#64748b");

    // Build color scale
    const maxTime = d3.max(data, (d: HeatmapData) => d.avgTimeDays) || 1;
    const myColor = d3.scaleSequential()
      .interpolator(d3.interpolateYlOrRd)
      .domain([0, Number(maxTime)]);

    // create a tooltip
    const tooltip = d3.select(containerRef.current)
      .append("div")
      .style("opacity", 0)
      .attr("class", "absolute bg-slate-800 text-white text-xs p-2 rounded shadow pointer-events-none")
      .style("z-index", 10);

    // add rectangles
    g.selectAll()
      .data(data, (d: any) => d.department+':'+d.category)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.category) || 0)
      .attr("y", (d) => y(d.department) || 0)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d) => d.avgTimeDays === -1 ? "#f1f5f9" : myColor(d.avgTimeDays))
      .style("stroke-width", 4)
      .style("stroke", "none")
      .style("opacity", 0.8)
      .on("mouseover", function(event, d) {
        if (d.avgTimeDays === -1) return;
        
        d3.select(this)
          .style("stroke", "black")
          .style("opacity", 1);
          
        tooltip
          .style("opacity", 1)
          .html(`${d.department}<br>Cat: ${d.category}<br>Avg: ${d.avgTimeDays.toFixed(1)} days (${d.count} cases)`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseleave", function(event, d) {
        if (d.avgTimeDays === -1) return;
        
        d3.select(this)
          .style("stroke", "none")
          .style("opacity", 0.8);
          
        tooltip.style("opacity", 0);
      });

  }, [parsedData, grievances]);

  if (parsedData.departments.length === 0) {
      return (
          <div className="flex items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-sm">
              Not enough resolved data to generate performance heatmap.
          </div>
      );
  }

  return (
    <div ref={containerRef} className="w-full overflow-hidden relative">
      <svg ref={svgRef} className="w-full"></svg>
    </div>
  );
}
