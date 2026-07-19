/**
 * ArenaPulse AI - SVG Chart Renderer for Stadium Analytics
 * Light, fast, accessible, secure, and 100% self-contained.
 */

// Colors matching stadium congestion statuses
const STATUS_COLORS = {
  success: 'var(--success)', // Green
  accent: 'var(--accent)',   // Gold/Orange
  danger: 'var(--danger)',   // Red
  info: 'var(--info)'        // Blue
};

const SECTOR_STYLES = {
  north: { label: 'North Stand', color: 'var(--info)', icon: '🟦' },
  east: { label: 'East Stand', color: 'var(--accent)', icon: '🟨' },
  south: { label: 'South Stand', color: 'var(--primary)', icon: '🟩' },
  west: { label: 'West Stand', color: 'var(--danger)', icon: '🟥' }
};

/**
 * Renders a Donut Chart representing Stadium Sector Crowd Densities
 * @param {string} containerId - Element ID to render into
 * @param {Object} densities - { north, east, south, west } representing capacity percent (0-100)
 */
export function renderDonutChart(containerId, densities) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const sectors = Object.keys(densities);
  const totalDensity = sectors.reduce((sum, k) => sum + densities[k], 0);
  
  if (totalDensity === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); text-align: center;">No sector density data available.</div>';
    return;
  }

  // Create responsive SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 360 220');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.overflow = 'visible';

  // Accessibility summary
  const a11ySummary = document.createElement('div');
  a11ySummary.className = 'chart-description';
  a11ySummary.id = `${containerId}-summary`;
  a11ySummary.textContent = `Donut chart of stadium stands occupancy: North ${densities.north}%, East ${densities.east}%, South ${densities.south}%, West ${densities.west}%.`;
  container.appendChild(a11ySummary);
  svg.setAttribute('aria-describedby', `${containerId}-summary`);
  svg.setAttribute('role', 'img');

  const radius = 60;
  const strokeWidth = 16;
  const cx = 110;
  const cy = 110;
  const circumference = 2 * Math.PI * radius;

  // Render donut ring segments (equally spaced segments showing fill ratios)
  let currentOffset = 0;
  const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  chartGroup.setAttribute('transform', 'rotate(-90 110 110)');

  const segmentLength = circumference / sectors.length;

  sectors.forEach((key) => {
    const fillPercent = densities[key] / 100;
    const strokeDash = segmentLength; // Uniform arcs

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', 'none');
    
    // Scale color brightness based on density
    const color = SECTOR_STYLES[key].color;
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(strokeWidth));
    // Gap size creates individual blocks
    circle.setAttribute('stroke-dasharray', `${strokeDash - 2} ${circumference - strokeDash + 2}`);
    circle.setAttribute('stroke-dashoffset', String(currentOffset));
    circle.setAttribute('class', 'donut-segment');
    circle.style.transition = 'stroke-width 0.2s ease, opacity 0.2s ease';
    circle.style.cursor = 'pointer';
    circle.style.opacity = String(0.4 + (fillPercent * 0.6)); // denser = brighter

    // Interactive hovers
    circle.addEventListener('mouseenter', () => {
      circle.setAttribute('stroke-width', String(strokeWidth + 4));
      document.getElementById(`${containerId}-center-val`).textContent = `${densities[key]}%`;
      document.getElementById(`${containerId}-center-label`).textContent = SECTOR_STYLES[key].label;
    });

    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('stroke-width', String(strokeWidth));
      const avg = Math.round(totalDensity / sectors.length);
      document.getElementById(`${containerId}-center-val`).textContent = `${avg}%`;
      document.getElementById(`${containerId}-center-label`).textContent = 'Avg Occupancy';
    });

    chartGroup.appendChild(circle);
    currentOffset -= strokeDash;
  });

  svg.appendChild(chartGroup);

  // Center occupancy text
  const centerTextGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const avgOccupancy = Math.round(totalDensity / sectors.length);

  const centerVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerVal.setAttribute('x', String(cx));
  centerVal.setAttribute('y', String(cy + 4));
  centerVal.setAttribute('text-anchor', 'middle');
  centerVal.setAttribute('id', `${containerId}-center-val`);
  centerVal.setAttribute('fill', 'var(--text-primary)');
  centerVal.setAttribute('font-family', 'var(--font-display)');
  centerVal.setAttribute('font-weight', '700');
  centerVal.setAttribute('font-size', '20px');
  centerVal.textContent = `${avgOccupancy}%`;

  const centerLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerLabel.setAttribute('x', String(cx));
  centerLabel.setAttribute('y', String(cy + 20));
  centerLabel.setAttribute('text-anchor', 'middle');
  centerLabel.setAttribute('id', `${containerId}-center-label`);
  centerLabel.setAttribute('fill', 'var(--text-muted)');
  centerLabel.setAttribute('font-family', 'var(--font-body)');
  centerLabel.setAttribute('font-size', '10px');
  centerLabel.setAttribute('font-weight', '600');
  centerLabel.textContent = 'Avg Occupancy';

  centerTextGroup.appendChild(centerVal);
  centerTextGroup.appendChild(centerLabel);
  svg.appendChild(centerTextGroup);

  // Render Legend
  const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  legendGroup.setAttribute('transform', 'translate(210, 45)');

  let legendOffset = 0;
  sectors.forEach((key) => {
    const val = densities[key];
    const legendItem = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendItem.setAttribute('transform', `translate(0, ${legendOffset})`);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    dot.setAttribute('width', '12');
    dot.setAttribute('height', '12');
    dot.setAttribute('rx', '3');
    dot.setAttribute('fill', SECTOR_STYLES[key].color);
    dot.style.opacity = String(0.4 + (val / 100 * 0.6));

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '20');
    text.setAttribute('y', '10');
    text.setAttribute('fill', 'var(--text-secondary)');
    text.setAttribute('font-family', 'var(--font-body)');
    text.setAttribute('font-size', '11px');
    text.setAttribute('font-weight', '500');
    text.textContent = `${SECTOR_STYLES[key].icon} ${SECTOR_STYLES[key].label} (${val}%)`;

    legendItem.appendChild(dot);
    legendItem.appendChild(text);
    legendGroup.appendChild(legendItem);
    legendOffset += 26;
  });

  svg.appendChild(legendGroup);
  container.appendChild(svg);
}

/**
 * Renders a Bar Chart showing Gate Queue Wait Times
 * @param {string} containerId - Element ID to render into
 * @param {Object} queueData - { gateA: waitTimeMin, gateB, gateC, gateD }
 */
export function renderBenchmarkChart(containerId, queueData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const gates = [
    { key: 'gateA', label: 'Gate A (North)', value: queueData.gateA || 0 },
    { key: 'gateB', label: 'Gate B (East)', value: queueData.gateB || 0 },
    { key: 'gateC', label: 'Gate C (South)', value: queueData.gateC || 0 },
    { key: 'gateD', label: 'Gate D (West)', value: queueData.gateD || 0 }
  ];

  const a11ySummary = document.createElement('div');
  a11ySummary.className = 'chart-description';
  a11ySummary.id = `${containerId}-summary`;
  a11ySummary.textContent = `Bar chart of gate queue wait times: Gate A ${gates[0].value} mins, Gate B ${gates[1].value} mins, Gate C ${gates[2].value} mins, Gate D ${gates[3].value} mins.`;
  container.appendChild(a11ySummary);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 400 180');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('aria-describedby', `${containerId}-summary`);
  svg.setAttribute('role', 'img');
  svg.style.overflow = 'visible';

  const chartX = 100;
  const chartWidth = 260;
  // Maximum scale baseline: at least 30 mins to avoid giant bars for tiny times
  const maxValue = Math.max(30, ...gates.map(g => g.value) * 1.1);

  let barY = 15;

  gates.forEach((item) => {
    const itemPct = item.value / maxValue;
    const computedBarWidth = Math.max(5, itemPct * chartWidth);

    // Color code based on wait time status
    let barColor = STATUS_COLORS.success;
    if (item.value > 25) {
      barColor = STATUS_COLORS.danger;
    } else if (item.value > 10) {
      barColor = STATUS_COLORS.accent;
    }

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Label Text
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(chartX - 10));
    label.setAttribute('y', String(barY + 16));
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', 'var(--text-secondary)');
    label.setAttribute('font-family', 'var(--font-body)');
    label.setAttribute('font-size', '11px');
    label.setAttribute('font-weight', '600');
    label.textContent = item.label;

    // Bar Background Track
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    track.setAttribute('x', String(chartX));
    track.setAttribute('y', String(barY));
    track.setAttribute('width', String(chartWidth));
    track.setAttribute('height', '22');
    track.setAttribute('rx', '4');
    track.setAttribute('fill', 'var(--bg-surface-elevated)');

    // Filled Bar
    const fillBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    fillBar.setAttribute('x', String(chartX));
    fillBar.setAttribute('y', String(barY));
    fillBar.setAttribute('width', '0'); // Animate
    fillBar.setAttribute('height', '22');
    fillBar.setAttribute('rx', '4');
    fillBar.setAttribute('fill', barColor);

    // Value Text
    const valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    valText.setAttribute('x', String(chartX + computedBarWidth + 8));
    valText.setAttribute('y', String(barY + 15));
    valText.setAttribute('fill', item.value > 25 ? 'var(--danger)' : item.value > 10 ? 'var(--accent)' : 'var(--text-muted)');
    valText.setAttribute('font-family', 'var(--font-display)');
    valText.setAttribute('font-size', '11px');
    valText.setAttribute('font-weight', '700');
    valText.textContent = `${item.value} min`;

    group.appendChild(label);
    group.appendChild(track);
    group.appendChild(fillBar);
    group.appendChild(valText);
    svg.appendChild(group);

    // Animation
    setTimeout(() => {
      fillBar.setAttribute('width', String(computedBarWidth));
      fillBar.style.transition = 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    }, 50);

    barY += 38;
  });

  container.appendChild(svg);
}
