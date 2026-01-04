/* BLOIST-ANNOTATED-FILE: main.js
   PURPOSE: Site-wide JavaScript for navigation, dropdown menus, and the floating "Return to top" button.
   IMPORTANT: Keep this file dependency-free so the site remains fully static.
*/

/* Bloist.com — small, dependency-free interactivity for GitHub Pages */

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function setupMobileNav(){
  const btn = $('#navToggle');
  const panel = $('#navLinks');
  if(!btn || !panel) return;

  btn.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // dropdown toggles on mobile
  $$('.has-dropdown > a').forEach(a => {
    a.addEventListener('click', (e) => {
      const isMobile = window.matchMedia('(max-width: 960px)').matches;
      if(!isMobile) return;
      e.preventDefault();
      const dd = a.parentElement.querySelector('.dropdown');
      if(!dd) return;
      dd.classList.toggle('open');
    });
  });

  // close on outside click (mobile)
  document.addEventListener('click', (e) => {
    const isMobile = window.matchMedia('(max-width: 960px)').matches;
    if(!isMobile) return;
    const clickedInside = panel.contains(e.target) || btn.contains(e.target);
    if(!clickedInside){
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      $$('.dropdown.open', panel).forEach(d => d.classList.remove('open'));
    }
  });
}

function setupReveal(){
  const els = $$('.reveal');
  if(!('IntersectionObserver' in window) || els.length === 0) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(en.isIntersecting){
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    })
  }, {threshold:0.14});
  els.forEach(el => io.observe(el));
}

function setupCalculator(){
  const form = $('#solarCalc');
  if(!form) return;

  const out = $('#calcOut');
  const formatUSD = (n) => n.toLocaleString(undefined, {style:'currency', currency:'USD', maximumFractionDigits:0});

  form.addEventListener('input', () => {
    const bill = Number($('#bill').value || 0);
    const rate = Number($('#rate').value || 0.18); // $/kilowatt-hours
    const sun = Number($('#sun').value || 4.5); // peak-sun-hours per day
    const priceW = Number($('#priceW').value || 3.0); // $/W
    const offset = Number($('#offset').value || 0.85); // fraction
    const incentives = Number($('#incentives').value || 0.30); // fraction

    // rough sizing
    const monthlyKwh = (rate > 0) ? bill / rate : 0;
    const dailyKwh = monthlyKwh / 30.4;
    const neededKwh = dailyKwh * offset;

    // kilowatts size = kilowatt-hours/day / PSH / system_eff
    const eff = 0.80;
    const kw = (sun > 0) ? (neededKwh / (sun * eff)) : 0;

    const watts = kw * 1000;
    const gross = watts * priceW;
    const net = gross * (1 - incentives);

    // simple payback
    const annualSavings = bill * 12 * offset;
    const payback = annualSavings > 0 ? net / annualSavings : 0;

    out.innerHTML = `
      <div><b>Estimated system size:</b> ${kw.toFixed(1)} kilowatts</div>
      <div><b>Estimated annual production:</b> ${(kw * sun * 365 * eff).toFixed(0)} kilowatt-hours</div>
      <div><b>Estimated net cost:</b> ${formatUSD(Math.max(0, net))} <span class="note">(after incentives)</span></div>
      <div><b>Estimated simple payback:</b> ${payback ? payback.toFixed(1) : '—'} years</div>
      <div class="note" style="margin-top:8px">This is a fast back-of-the-envelope estimate. Real designs account for roof tilt/azimuth, shading, utility rules, and financing terms.</div>
    `;
  });

  // initialize
  form.dispatchEvent(new Event('input'));
}

function setupActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if(!href) return;
    const clean = href.split('/').pop();
    if(clean === path){
      a.style.color = 'var(--text)';
      a.style.background = 'rgba(255,255,255,.06)';
    }
  });
}


function setupReturnToTopFloat(){
  // One left-side button that becomes visible when someone jumps to a section (hash)
  // or scrolls down a bit.
  let btn = document.getElementById('returnTopFloat');
  if(!btn){
    btn = document.createElement('a');
    btn.id = 'returnTopFloat';
    btn.href = '#top';
    btn.textContent = 'Return To Top';
    document.body.appendChild(btn);
  }
  const refresh = () => {
    const h = window.location.hash || '';
    const scrolled = (window.scrollY || 0) > 260;
    const show = (h && h !== '#top') || scrolled;
    btn.classList.toggle('show', !!show);
  };
  window.addEventListener('hashchange', refresh);
  window.addEventListener('scroll', refresh, {passive:true});
  refresh();
}


document.addEventListener('DOMContentLoaded', () => {
  setupMobileNav();
  setupReveal();
  setupCalculator();
  setupActiveNav();
  setupReturnToTopFloat();
  setupOutageCalculator();
  setupAirQualityRegions();
});


function setupOutageCalculator(){
  const root = document.getElementById('outageCalc');
  if(!root) return;

  const devicePresets = [
    {label:'wireless internet router + modem', watts:20, surge:1.0, note:'Low energy, high value.'},
    {label:'Refrigerator', watts:180, surge:4.0, note:'Startup surge is common.'},
    {label:'Freezer', watts:160, surge:4.0, note:'Startup surge is common.'},
    {label:'Well pump', watts:1000, surge:3.0, note:'Large surge; check label.'},
    {label:'Sump pump', watts:800, surge:3.0, note:'Large surge; check label.'},
    {label:'Desktop computer', watts:200, surge:1.2, note:'Varies with load.'},
    {label:'Laptop computer', watts:60, surge:1.1, note:'Often lower than desktops.'},
    {label:'Television', watts:120, surge:1.1, note:'Modern units vary.'},
    {label:'Microwave', watts:1200, surge:1.2, note:'High draw while running.'},
    {label:'Phone chargers', watts:10, surge:1.0, note:'Per charger.'},
    {label:'Light bulb — LED', watts:10, surge:1.0, note:'Best efficiency.'},
    {label:'Light bulb — fluorescent', watts:18, surge:1.2, note:'Can have a small surge.'},
    {label:'Light bulb — incandescent', watts:60, surge:1.0, note:'High energy for the light output.'},
    {label:'Custom (enter watts)', watts:null, surge:1.0, note:'Use nameplate or a plug-in meter.'},
  ];

  const tbody = document.querySelector('#deviceTable tbody');
  const runtimeEl = document.getElementById('runtimeHours');
  const addBtn = document.getElementById('addDeviceRow');
  const emailBtn = document.getElementById('emailReport');
  const toEmailEl = document.getElementById('toEmail');
  const hintEl = document.getElementById('emailHint');
  const resultsEl = document.getElementById('outageResults');

  const makeRow = () => {
    const tr = document.createElement('tr');

    const tdDevice = document.createElement('td');
    const sel = document.createElement('select');
    sel.className = 'input';
    devicePresets.forEach((p,i)=>{
      const o=document.createElement('option');
      o.value=String(i);
      o.textContent=p.label;
      sel.appendChild(o);
    });
    const customWrap = document.createElement('div');
    customWrap.style.marginTop='8px';
    customWrap.style.display='none';
    const customInput = document.createElement('input');
    customInput.type='number';
    customInput.min='0';
    customInput.step='1';
    customInput.placeholder='Watts';
    customInput.className='input';
    customInput.style.maxWidth='140px';
    customWrap.appendChild(customInput);

    tdDevice.appendChild(sel);
    tdDevice.appendChild(customWrap);

    const tdQty = document.createElement('td');
    const qty = document.createElement('input');
    qty.type='number';
    qty.min='0';
    qty.step='1';
    qty.value='1';
    qty.className='input';
    qty.style.maxWidth='90px';
    tdQty.appendChild(qty);

    const tdWatts = document.createElement('td');
    const wattsText = document.createElement('span');
    wattsText.className='mono';
    const wattsInputWrap = document.createElement('div');
    wattsInputWrap.style.display='none';
    const wattsInput = document.createElement('input');
    wattsInput.type='number';
    wattsInput.min='0';
    wattsInput.step='1';
    wattsInput.className='input';
    wattsInput.style.maxWidth='140px';
    wattsInputWrap.appendChild(wattsInput);
    tdWatts.appendChild(wattsText);
    tdWatts.appendChild(wattsInputWrap);

    const tdNote = document.createElement('td');
    const note = document.createElement('span');
    note.className='note';
    tdNote.appendChild(note);

    const updatePreset = () => {
      const p = devicePresets[parseInt(sel.value,10)];
      const isCustom = p && p.watts == null;
      customWrap.style.display = isCustom ? 'block' : 'none';
      wattsInputWrap.style.display = isCustom ? 'block' : 'none';
      wattsText.style.display = isCustom ? 'none' : 'inline';
      if(!isCustom){
        wattsText.textContent = p.watts + ' W';
      }else{
        wattsInput.value = '';
      }
      note.textContent = p.note || '';
      recalc();
    };

    const getWatts = () => {
      const p = devicePresets[parseInt(sel.value,10)];
      if(!p) return 0;
      if(p.watts == null){
        const v = parseFloat(wattsInput.value);
        return isFinite(v) ? v : 0;
      }
      return p.watts;
    };

    const getSurgeWatts = () => {
      const p = devicePresets[parseInt(sel.value,10)];
      const w = getWatts();
      const mult = p && p.surge ? p.surge : 1.0;
      return w * mult;
    };

    const getQty = () => {
      const v=parseInt(qty.value,10);
      return isFinite(v) ? Math.max(0,v) : 0;
    };

    const removeBtn = document.createElement('button');
    removeBtn.type='button';
    removeBtn.className='btn btn-small';
    removeBtn.textContent='Remove';
    removeBtn.addEventListener('click', ()=>{
      tr.remove();
      recalc();
    });
    tdNote.appendChild(document.createElement('div')).appendChild(removeBtn);

    tr.appendChild(tdDevice);
    tr.appendChild(tdQty);
    tr.appendChild(tdWatts);
    tr.appendChild(tdNote);

    sel.addEventListener('change', updatePreset);
    qty.addEventListener('input', recalc);
    wattsInput.addEventListener('input', recalc);
    customInput.addEventListener('input', ()=>{
      wattsInput.value = customInput.value;
      recalc();
    });

    // store helpers on row
    tr._calc = {getWatts, getSurgeWatts, getQty, preset:()=>devicePresets[parseInt(sel.value,10)]};
    updatePreset();
    return tr;
  };

  const recalc = () => {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    let steadyW = 0;
    let surgeW = 0;
    const parts=[];
    rows.forEach(r=>{
      const qty = r._calc.getQty();
      const w = r._calc.getWatts();
      const sw = r._calc.getSurgeWatts();
      if(qty<=0 || w<=0) return;
      steadyW += qty*w;
      surgeW += qty*sw;
      const p = r._calc.preset();
      parts.push({device:p.label, qty, watts:w, surge:sw});
    });

    const hours = parseFloat(runtimeEl.value);
    const runtimeH = isFinite(hours) ? Math.max(0, hours) : 0;
    const energyWh = steadyW * runtimeH;
    const energyKwh = energyWh/1000;

    resultsEl.innerHTML = `
      <div class="grid-3">
        <div class="metric"><div class="kpi">${Math.round(steadywatts)} W</div><div class="note">Estimated steady power</div></div>
        <div class="metric"><div class="kpi">${Math.round(surgewatts)} W</div><div class="note">Surge allowance (rough)</div></div>
        <div class="metric"><div class="kpi">${energyKwh ? energyKwh.toFixed(1) : '0.0'} kilowatt-hours</div><div class="note">Energy for ${runtimeH} hour(s)</div></div>
      </div>
      <div class="note" style="margin-top:10px">
        Simple rule of thumb: usable battery energy is often less than nameplate energy after inverter losses and reserve. Plan margin.
      </div>
    `;

    // prepare email payload
    const lines = [];
    lines.push('Contact Pat: patrick.proctor@yahoo.com');
    lines.push('');
    lines.push('Outage device list');
    lines.push(`Runtime (hours): ${runtimeH}`);
    lines.push(`Estimated steady power (watts): ${Math.round(steadywatts)}`);
    lines.push(`Estimated surge allowance (watts): ${Math.round(surgewatts)}`);
    lines.push(`Estimated energy (kilowatt-hours): ${energyKwh ? energyKwh.toFixed(1) : '0.0'}`);
    lines.push('');
    lines.push('Items:');
    parts.forEach(p=>{
      lines.push(`- ${p.device} — quantity ${p.qty}, typical watts ${p.watts}${p.watts?'' : ''}`);
    });
    lines.push('');
    lines.push('Note: For accuracy, confirm actual watts on the device label or with a plug-in power meter.');
    root._emailBody = lines.join('\n');
  };

  addBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    tbody.appendChild(makeRow());
    recalc();
  });

  emailBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    const to = (toEmailEl.value || '').trim();
    if(!to){
      hintEl.textContent = 'Enter your email address first.';
      toEmailEl.focus();
      return;
    }
    hintEl.textContent = '';
    const subject = encodeURIComponent('Outage report (device list)');
    const body = encodeURIComponent(root._emailBody || '');
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
  });

  // initial rows
  tbody.appendChild(makeRow());
  tbody.appendChild(makeRow());
  recalc();
}

function setupAirQualityRegions(){
  const mount = document.getElementById('airQualityRegions');
  if(!mount) return;

  const regions = [
    { key:'us', title:'United States', cities:[
      {city:'Los Angeles', country:'US'}, {city:'New York', country:'US'}, {city:'Chicago', country:'US'},
      {city:'Houston', country:'US'}, {city:'Phoenix', country:'US'}
    ]},
    { key:'mexico', title:'Mexico', cities:[
      {city:'Mexico City', country:'MX'}, {city:'Guadalajara', country:'MX'}, {city:'Monterrey', country:'MX'},
      {city:'Puebla', country:'MX'}, {city:'Tijuana', country:'MX'}
    ]},
    { key:'europe', title:'Europe', cities:[
      {city:'London', country:'GB'}, {city:'Paris', country:'FR'}, {city:'Berlin', country:'DE'},
      {city:'Madrid', country:'ES'}, {city:'Rome', country:'IT'}
    ]},
    { key:'india', title:'India', cities:[
      {city:'Delhi', country:'IN'}, {city:'Mumbai', country:'IN'}, {city:'Bengaluru', country:'IN'},
      {city:'Kolkata', country:'IN'}, {city:'Chennai', country:'IN'}
    ]},
    { key:'china', title:'China', cities:[
      {city:'Beijing', country:'CN'}, {city:'Shanghai', country:'CN'}, {city:'Guangzhou', country:'CN'},
      {city:'Shenzhen', country:'CN'}, {city:'Chengdu', country:'CN'}
    ]},
  ];

  const apiBase = 'https://api.openaq.org/v2/latest';

  async function fetchLatest(city, country, parameter){
    const url = new URL(apiBase);
    url.searchParams.set('limit','100');
    url.searchParams.set('city', city);
    url.searchParams.set('country', country);
    url.searchParams.set('parameter', parameter);
    // prefer newest
    url.searchParams.set('sort','desc');
    url.searchParams.set('order_by','lastUpdated');
    try{
      const res = await fetch(url.toString(), {headers:{'accept':'application/json'}});
      if(!res.ok) return null;
      const data = await res.json();
      const results = (data && data.results) ? data.results : [];
      // find first measurement value
      for(const r of results){
        if(!r || !r.measurements) continue;
        const m = r.measurements.find(x=>x.parameter===parameter && typeof x.value === 'number');
        if(m) return {value:m.value, unit:m.unit || '', lastUpdated:r.lastUpdated || ''};
      }
      return null;
    }catch(e){
      return null;
    }
  }

  function makeCard(region){
    const card=document.createElement('div');
    card.className='card';
    card.innerHTML = `
      <h3 style="margin-top:0">${region.title}</h3>
      <div class="note">Latest city snapshot (fine particle pollution). Hover to see details.</div>
      <div class="aq-chart" id="aq-${region.key}"></div>
    `;
    return card;
  }

  function renderBarChart(el, rows){
    // rows: [{label, pm, no2, updated}]
    const width = 520;
    const barH = 24;
    const gap = 10;
    const leftPad = 170;
    const rightPad = 22;
    const topPad = 18;
    const maxBars = rows.length;
    const height = topPad + maxBars*(barH+gap) + 18;
    const maxVal = Math.max(5, ...rows.map(r=> (typeof r.pm==='number' ? r.pm : 0)));
    const scale = (width-leftPad-rightPad) / maxVal;

    const svgNS="http://www.w3.org/2000/svg";
    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class','aq-svg');

    const title=document.createElementNS(svgNS,'text');
    title.setAttribute('x','0'); title.setAttribute('y','14');
    title.textContent='Fine particle pollution (micrograms per cubic meter)';
    title.setAttribute('class','aq-title');
    svg.appendChild(title);

    rows.forEach((r,i)=>{
      const y = topPad + i*(barH+gap);
      const label=document.createElementNS(svgNS,'text');
      label.setAttribute('x','0');
      label.setAttribute('y', String(y+barH-7));
      label.setAttribute('class','aq-label');
      label.textContent=r.label;
      svg.appendChild(label);

      const val = (typeof r.pm==='number') ? r.pm : 0;
      const w = Math.max(2, val*scale);

      const rect=document.createElementNS(svgNS,'rect');
      rect.setAttribute('x', String(leftPad));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(barH));
      rect.setAttribute('rx','8');
      rect.setAttribute('class','aq-bar');
      rect.dataset.tooltip = JSON.stringify(r);
      svg.appendChild(rect);

      const valText=document.createElementNS(svgNS,'text');
      valText.setAttribute('x', String(leftPad + w + 8));
      valText.setAttribute('y', String(y+barH-7));
      valText.setAttribute('class','aq-value');
      valText.textContent = (typeof r.pm==='number') ? `${r.pm.toFixed(1)}` : '—';
      svg.appendChild(valText);
    });

    // Tooltip
    let tip = document.getElementById('aqTooltip');
    if(!tip){
      tip=document.createElement('div');
      tip.id='aqTooltip';
      tip.className='aq-tooltip';
      document.body.appendChild(tip);
    }

    svg.addEventListener('mousemove', (e)=>{
      const target = e.target;
      if(!(target instanceof SVGRectElement) || !target.dataset.tooltip){
        tip.classList.remove('show');
        return;
      }
      const r = JSON.parse(target.dataset.tooltip);
      const pm = (typeof r.pm==='number') ? r.pm.toFixed(1) : '—';
      const no2 = (typeof r.no2==='number') ? r.no2.toFixed(1) : '—';
      tip.innerHTML = `<b>${r.label}</b><div>Fine particle pollution: ${pm}</div><div>Nitrogen dioxide: ${no2}</div><div class="muted">Updated: ${r.updated || '—'}</div>`;
      tip.style.left = (e.clientX + 14) + 'px';
      tip.style.top = (e.clientY + 14) + 'px';
      tip.classList.add('show');
    });
    svg.addEventListener('mouseleave', ()=> tip.classList.remove('show'));

    el.innerHTML='';
    el.appendChild(svg);
  }

  async function loadRegion(region){
    const rows=[];
    for(const c of region.cities){
      const pm = await fetchLatest(c.city, c.country, 'pm25');
      const no2 = await fetchLatest(c.city, c.country, 'no2');
      rows.push({
        label: c.city,
        pm: pm ? pm.value : null,
        no2: no2 ? no2.value : null,
        updated: (pm && pm.lastUpdated) ? pm.lastUpdated : (no2 && no2.lastUpdated) ? no2.lastUpdated : ''
      });
    }
    // sort by pm desc
    rows.sort((a,b)=>(b.pm||0)-(a.pm||0));
    const el=document.getElementById('aq-'+region.key);
    if(el) renderBarChart(el, rows);
  }

  // mount cards
  mount.innerHTML='';
  regions.forEach(r=> mount.appendChild(makeCard(r)));

  // load async
  regions.forEach(r=> loadRegion(r));
}
