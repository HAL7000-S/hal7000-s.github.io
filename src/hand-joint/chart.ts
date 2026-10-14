import Plotly from 'plotly.js-basic-dist-min';
import type { Joint, Sample } from './types';
export class JointChart {
  private drawing = false;
  constructor(readonly element: HTMLDivElement) {}
  async init(): Promise<void> {
    await Plotly.newPlot(this.element, [
      { x: [], y: [], mode: 'lines', type: 'scatter', line: { color: '#397b9c', width: 2 }, connectgaps: false, hoverinfo: 'skip' },
      { x: [], y: [], mode: 'markers', type: 'scatter', marker: { color: '#e27843', size: 11 }, hovertemplate: 'Wrist %{x:.1f}°<br>Finger %{y:.1f}°<extra></extra>' }
    ], { margin: { l: 62, r: 18, t: 18, b: 55 }, xaxis: { title: { text: 'Wrist angle [deg]' }, zerolinecolor: '#abb9c4', gridcolor: '#edf1f4' }, yaxis: { title: { text: 'MCP angle [deg]' }, zerolinecolor: '#abb9c4', gridcolor: '#edf1f4' }, showlegend: false, font: { family: 'system-ui', color: '#34485a' }, paper_bgcolor: '#fff', plot_bgcolor: '#fff' }, { responsive: true, displayModeBar: false, scrollZoom: false });
    const observer = new ResizeObserver(() => { void Plotly.Plots.resize(this.element); });
    observer.observe(this.element);
  }
  async render(samples: readonly Sample[], joint: Joint): Promise<boolean> {
    if (this.drawing) return false;
    this.drawing = true;
    try {
      const x: (number | null)[] = [], y: (number | null)[] = [];
      samples.forEach((s, i) => { if (i && s.segment !== samples[i - 1].segment) { x.push(null); y.push(null); } x.push(s.wristAngle); y.push(s[joint]); });
      const last = samples.at(-1);
      await Plotly.restyle(this.element, { x: [x, last ? [last.wristAngle] : []], y: [y, last ? [last[joint]] : []] }, [0, 1]);
      await Plotly.relayout(this.element, { yaxis: { title: { text: `${joint === 'mcpAngle' ? 'MCP' : 'PIP'} angle [deg]` }, autorange: true, gridcolor: '#edf1f4', zerolinecolor: '#abb9c4' }, xaxis: { title: { text: 'Wrist angle [deg]' }, autorange: true, gridcolor: '#edf1f4', zerolinecolor: '#abb9c4' } });
      return true;
    } finally { this.drawing = false; }
  }
}
