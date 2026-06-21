/**
 * EcoPulse - Client-Side SVG Chart Renderer
 * Light, fast, accessible, secure, and 100% self-contained.
 */

// Category styles & colors matching CSS theme variables
const CATEGORY_STYLES = {
  transport: { label: 'Transport', color: 'hsl(199, 89%, 48%)', icon: '🚗' }, // Info blue
  energy: { label: 'Energy', color: 'hsl(45, 100%, 50%)', icon: '⚡' },     // Accent Gold
  food: { label: 'Diet & Food', color: 'hsl(142, 72%, 40%)', icon: '🥗' },  // Primary Green
  consumption: { label: 'Shopping', color: 'hsl(0, 84%, 60%)', icon: '🛍️' } // Danger Red
};

/**
 * Renders a responsive Donut Chart inside a container
 * @param {string} containerId - Element ID to render into
 * @param {Object} breakdown - Object containing { transport, energy, food, consumption } in tons
 */
export function renderDonutChart(containerId, breakdown) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous content
  container.innerHTML = '';

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    container.innerHTML = '<div style="color: var(--text-muted);">No carbon footprint data to display. Please complete the calculator.</div>';
    return;
  }

  // Create responsive SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 360 220');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.overflow = 'visible';

  // Screen reader table for accessibility
  const a11ySummary = document.createElement('div');
  a11ySummary.className = 'chart-description';
  a11ySummary.id = `${containerId}-summary`;
  a11ySummary.textContent = `A breakdown of carbon emissions: Transport ${breakdown.transport} tons, Energy ${breakdown.energy} tons, Food ${breakdown.food} tons, Shopping ${breakdown.consumption} tons. Total footprint is ${total} tons CO2 equivalent per year.`;
  container.appendChild(a11ySummary);
  svg.setAttribute('aria-describedby', `${containerId}-summary`);
  svg.setAttribute('role', 'img');

  // Math for Donut Ring
  const radius = 60;
  const strokeWidth = 16;
  const cx = 110;
  const cy = 110;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  chartGroup.setAttribute('transform', 'rotate(-90 110 110)'); // Start from top

  // Create segments
  Object.keys(breakdown).forEach((key) => {
    const value = breakdown[key];
    if (value <= 0) return;
    
    const percentage = value / total;
    const strokeDash = percentage * circumference;
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', CATEGORY_STYLES[key].color);
    circle.setAttribute('stroke-width', String(strokeWidth));
    circle.setAttribute('stroke-dasharray', `${strokeDash} ${circumference}`);
    circle.setAttribute('stroke-dashoffset', String(currentOffset));
    circle.setAttribute('class', 'donut-segment');
    circle.style.transition = 'stroke-width 0.2s ease, opacity 0.2s ease';
    circle.style.cursor = 'pointer';

    // Interactive hover triggers
    circle.addEventListener('mouseenter', () => {
      circle.setAttribute('stroke-width', String(strokeWidth + 4));
      // Display hover info in center text if wanted
      document.getElementById(`${containerId}-center-val`).textContent = `${value.toFixed(1)} t`;
      document.getElementById(`${containerId}-center-label`).textContent = CATEGORY_STYLES[key].label;
    });

    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('stroke-width', String(strokeWidth));
      document.getElementById(`${containerId}-center-val`).textContent = `${total.toFixed(1)} t`;
      document.getElementById(`${containerId}-center-label`).textContent = 'Total / Year';
    });

    chartGroup.appendChild(circle);
    currentOffset -= strokeDash;
  });

  svg.appendChild(chartGroup);

  // Center Text in Donut
  const centerTextGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  
  const centerVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerVal.setAttribute('x', String(cx));
  centerVal.setAttribute('y', String(cy + 4));
  centerVal.setAttribute('text-anchor', 'middle');
  centerVal.setAttribute('id', `${containerId}-center-val`);
  centerVal.setAttribute('fill', 'var(--text-primary)');
  centerVal.setAttribute('font-family', 'var(--font-display)');
  centerVal.setAttribute('font-weight', '700');
  centerVal.setAttribute('font-size', '20px');
  centerVal.textContent = `${total.toFixed(1)} t`;
  
  const centerLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerLabel.setAttribute('x', String(cx));
  centerLabel.setAttribute('y', String(cy + 20));
  centerLabel.setAttribute('text-anchor', 'middle');
  centerLabel.setAttribute('id', `${containerId}-center-label`);
  centerLabel.setAttribute('fill', 'var(--text-muted)');
  centerLabel.setAttribute('font-family', 'var(--font-body)');
  centerLabel.setAttribute('font-size', '10px');
  centerLabel.setAttribute('font-weight', '600');
  centerLabel.textContent = 'Total / Year';

  centerTextGroup.appendChild(centerVal);
  centerTextGroup.appendChild(centerLabel);
  svg.appendChild(centerTextGroup);

  // Render Legend
  const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  legendGroup.setAttribute('transform', 'translate(220, 45)');
  
  let legendOffset = 0;
  Object.keys(breakdown).forEach((key) => {
    const value = breakdown[key];
    const pct = ((value / total) * 100).toFixed(0);
    
    const legendItem = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendItem.setAttribute('transform', `translate(0, ${legendOffset})`);
    
    // Colored box indicator
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    dot.setAttribute('width', '12');
    dot.setAttribute('height', '12');
    dot.setAttribute('rx', '3');
    dot.setAttribute('fill', CATEGORY_STYLES[key].color);
    
    // Text Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '20');
    text.setAttribute('y', '10');
    text.setAttribute('fill', 'var(--text-secondary)');
    text.setAttribute('font-family', 'var(--font-body)');
    text.setAttribute('font-size', '11px');
    text.setAttribute('font-weight', '500');
    text.textContent = `${CATEGORY_STYLES[key].icon} ${CATEGORY_STYLES[key].label} (${pct}%)`;

    legendItem.appendChild(dot);
    legendItem.appendChild(text);
    legendGroup.appendChild(legendItem);
    
    legendOffset += 26;
  });

  svg.appendChild(legendGroup);
  container.appendChild(svg);
}

/**
 * Renders a Bar Chart comparing the user footprint with standard benchmarks
 * @param {string} containerId - Element ID to render into
 * @param {number} userTotal - User's carbon total in tCO2e/year
 */
export function renderBenchmarkChart(containerId, userTotal) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const benchmarks = [
    { key: 'target', label: 'Paris Target', value: 2.0, color: 'hsl(142, 72%, 40%)' }, // Green
    { key: 'global', label: 'Global Avg', value: 4.5, color: 'hsl(199, 89%, 48%)' },   // Blue
    { key: 'user', label: 'You (EcoPulse)', value: userTotal, color: 'hsl(45, 100%, 50%)' }, // Yellow
    { key: 'usa', label: 'US Average', value: 16.0, color: 'hsl(0, 84%, 60%)' }       // Red
  ];

  // Screen reader table for accessibility
  const a11ySummary = document.createElement('div');
  a11ySummary.className = 'chart-description';
  a11ySummary.id = `${containerId}-summary`;
  a11ySummary.textContent = `A comparison of your footprint against standard benchmarks: Paris Target 2.0 tons, Global Average 4.5 tons, Your footprint ${userTotal} tons, US Average 16.0 tons CO2 equivalent per year.`;
  container.appendChild(a11ySummary);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 400 180');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('aria-describedby', `${containerId}-summary`);
  svg.setAttribute('role', 'img');
  svg.style.overflow = 'visible';

  const chartX = 90;
  const chartWidth = 280;
  const maxValue = Math.max(16.0, userTotal * 1.15); // Adjust scale based on user footprint

  let barY = 15;
  
  benchmarks.forEach((item) => {
    const isUser = item.key === 'user';
    const itemPct = item.value / maxValue;
    const computedBarWidth = Math.max(8, itemPct * chartWidth);

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Label text
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(chartX - 10));
    label.setAttribute('y', String(barY + 16));
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', isUser ? 'var(--text-primary)' : 'var(--text-secondary)');
    label.setAttribute('font-family', 'var(--font-body)');
    label.setAttribute('font-size', '11px');
    label.setAttribute('font-weight', isUser ? '700' : '500');
    label.textContent = item.label;

    // Bar background tracking
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    track.setAttribute('x', String(chartX));
    track.setAttribute('y', String(barY));
    track.setAttribute('width', String(chartWidth));
    track.setAttribute('height', '22');
    track.setAttribute('rx', '4');
    track.setAttribute('fill', 'var(--bg-surface-elevated)');

    // Filled bar representation
    const fillBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    fillBar.setAttribute('x', String(chartX));
    fillBar.setAttribute('y', String(barY));
    fillBar.setAttribute('width', '0'); // Animate from 0 width
    fillBar.setAttribute('height', '22');
    fillBar.setAttribute('rx', '4');
    fillBar.setAttribute('fill', item.color);
    if (isUser) {
      fillBar.setAttribute('stroke', 'var(--text-primary)');
      fillBar.setAttribute('stroke-width', '1');
    }

    // Value text
    const valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    valText.setAttribute('x', String(chartX + computedBarWidth + 8));
    valText.setAttribute('y', String(barY + 15));
    valText.setAttribute('fill', isUser ? 'var(--accent)' : 'var(--text-muted)');
    valText.setAttribute('font-family', 'var(--font-display)');
    valText.setAttribute('font-size', '11px');
    valText.setAttribute('font-weight', '700');
    valText.textContent = `${item.value.toFixed(1)} t`;

    group.appendChild(label);
    group.appendChild(track);
    group.appendChild(fillBar);
    group.appendChild(valText);
    svg.appendChild(group);

    // Dynamic width rendering animation
    setTimeout(() => {
      fillBar.setAttribute('width', String(computedBarWidth));
      fillBar.style.transition = 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    }, 50);

    barY += 38;
  });

  container.appendChild(svg);
}
