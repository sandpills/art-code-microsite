const canvas = document.getElementById('canvas');
const coordsEl = document.getElementById('coords');

const CANVAS_W = 4000;
const CANVAS_H = 3000;

let pan = { x: -100, y: -60 };
let zoom = 1;
let dragging = false;
let dragStart = { x: 0, y: 0 };
let panStart = { x: 0, y: 0 };

function applyTransform() {
    canvas.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
    canvas.style.transformOrigin = '0 0';
    coordsEl.textContent = `${Math.round(-pan.x / zoom)}, ${Math.round(-pan.y / zoom)}`;
}

// dragging and resizing .plot elements
let dragPlot = null;
let dragPlotStart = { x: 0, y: 0 };
let dragPlotOrigin = { x: 0, y: 0 };

let resizePlot = null;
let resizeStart = { x: 0, y: 0 };
let resizeOrigin = { w: 0, h: 0 };

document.addEventListener('mousedown', e => {
    if (e.target.closest('a, input, button, select, textarea, label')) return;

    if (e.target.classList.contains('resize-handle')) {
        resizePlot = e.target.closest('.plot');
        resizeStart = { x: e.clientX, y: e.clientY };
        resizeOrigin = { w: resizePlot.offsetWidth, h: resizePlot.offsetHeight };
        return;
    }

    const plot = e.target.closest('.plot');
    if (plot) {
        dragPlot = plot;
        dragPlotStart = { x: e.clientX, y: e.clientY };
        dragPlotOrigin = { x: parseInt(plot.style.left), y: parseInt(plot.style.top) };
        return;
    }

    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    panStart = { ...pan };
});
document.addEventListener('mousemove', e => {
    if (resizePlot) {
        const dw = (e.clientX - resizeStart.x) / zoom;
        const dh = (e.clientY - resizeStart.y) / zoom;
        resizePlot.style.width = Math.max(80, resizeOrigin.w + dw) + 'px';
        resizePlot.style.height = Math.max(60, resizeOrigin.h + dh) + 'px';
        return;
    }
    if (dragPlot) {
        const dx = (e.clientX - dragPlotStart.x) / zoom;
        const dy = (e.clientY - dragPlotStart.y) / zoom;
        dragPlot.style.left = (dragPlotOrigin.x + dx) + 'px';
        dragPlot.style.top = (dragPlotOrigin.y + dy) + 'px';
        return;
    }
    if (!dragging) return;
    pan.x = panStart.x + (e.clientX - dragStart.x);
    pan.y = panStart.y + (e.clientY - dragStart.y);
    applyTransform();
});
document.addEventListener('mouseup', () => { dragging = false; dragPlot = null; resizePlot = null; });

document.addEventListener('wheel', e => {
    e.preventDefault();
    const newZoom = Math.min(2.5, Math.max(0.3, zoom - e.deltaY * 0.001));
    pan.x = e.clientX - (newZoom / zoom) * (e.clientX - pan.x);
    pan.y = e.clientY - (newZoom / zoom) * (e.clientY - pan.y);
    zoom = newZoom;
    applyTransform();
}, { passive: false });

let touchStart = null;
document.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panStart = { ...pan };
    }
});
document.addEventListener('touchmove', e => {
    if (!touchStart || e.touches.length !== 1) return;
    e.preventDefault();
    pan.x = panStart.x + (e.touches[0].clientX - touchStart.x);
    pan.y = panStart.y + (e.touches[0].clientY - touchStart.y);
    applyTransform();
}, { passive: false });
document.addEventListener('touchend', () => { touchStart = null; });

let degrees = ['135deg', '90deg', 'to top', 'to left', '45deg', '180deg'];
let endColors = ['#ffffff', '#c7c7c7be', '#ff5af479', 'transparent', '#fbff004f', '#002fff5f'];

function buildPlot(member) {
    const plot = document.createElement('div');
    plot.className = 'plot';
    plot.style.left = member.x + 'px';
    plot.style.top = member.y + 'px';
    if (member.accent) {
        let randDeg = degrees[Math.floor(Math.random() * degrees.length)];
        let randCol = endColors[Math.floor(Math.random() * endColors.length)];
        plot.style.background = `linear-gradient(${randDeg}, ${member.accent}, ${randCol})`; plot.style.setProperty('--accent', member.accent);
    }
    plot.innerHTML = `<a href="members/${member.slug}/">${member.name}</a><div class="resize-handle"></div>`;
    return plot;
}

async function init() {
    const members = await fetch('data.json').then(r => r.json());
    members.forEach(m => canvas.appendChild(buildPlot(m)));
    applyTransform();
}

init();
