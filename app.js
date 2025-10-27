
// Simple static Daily Study Tracker (no frameworks)
// Uses localStorage key 'daily-study-entries-v2'

const KEY = 'daily-study-entries-v2';

function todayISO(d = new Date()){
  const tz = d.getTimezoneOffset()*60000;
  return new Date(d - tz).toISOString().slice(0,10);
}

const dateInput = document.getElementById('date');
const phy = document.getElementById('phy');
const chem = document.getElementById('chem');
const math = document.getElementById('math');
const mocks = document.getElementById('mocks');
const form = document.getElementById('entryForm');
const entriesWrap = document.getElementById('entries');
const totalsText = document.getElementById('totalsText');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const clearAllBtn = document.getElementById('clearAll');
const clearFormBtn = document.getElementById('clearForm');
const ctx = document.getElementById('chart').getContext('2d');

dateInput.value = todayISO();

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error(e);
    return [];
  }
}

function saveList(list){
  localStorage.setItem(KEY, JSON.stringify(list));
  render();
}

function addOrUpdate(entry){
  const list = load().filter(e => e.date !== entry.date);
  list.push(entry);
  list.sort((a,b)=> a.date > b.date ? 1 : -1);
  saveList(list);
}

function removeDate(date){
  const list = load().filter(e => e.date !== date);
  saveList(list);
}

function clearAll(){
  if(!confirm('Delete all saved entries?')) return;
  saveList([]);
}

form.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const entry = {
    date: dateInput.value,
    physics: Number(phy.value || 0),
    chemistry: Number(chem.value || 0),
    maths: Number(math.value || 0),
    mocks: Number(mocks.value || 0)
  };
  addOrUpdate(entry);
  form.reset();
  dateInput.value = todayISO();
  phy.value = chem.value = math.value = mocks.value = 0;
});

clearFormBtn.addEventListener('click', ()=>{
  form.reset();
  dateInput.value = todayISO();
  phy.value = chem.value = math.value = mocks.value = 0;
});

exportBtn.addEventListener('click', ()=>{
  const data = load();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'study-entries.json'; a.click();
  URL.revokeObjectURL(url);
});

importFile.addEventListener('change', (e)=>{
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    try{
      const parsed = JSON.parse(ev.target.result);
      if(!Array.isArray(parsed)) throw new Error('Invalid file format - expected array');
      saveList(parsed.sort((a,b)=> a.date > b.date ? 1 : -1));
      alert('Import successful');
    }catch(err){
      alert('Import failed: ' + err.message);
    }
  };
  reader.readAsText(f);
});

clearAllBtn.addEventListener('click', clearAll);

function render(){
  const list = load();
  // totals
  const totals = list.reduce((acc,c)=>{
    acc.physics += Number(c.physics||0);
    acc.chemistry += Number(c.chemistry||0);
    acc.maths += Number(c.maths||0);
    acc.mocks += Number(c.mocks||0);
    return acc;
  }, {physics:0, chemistry:0, maths:0, mocks:0});
  totalsText.textContent = `Physics: ${totals.physics}  |  Chemistry: ${totals.chemistry}  |  Maths: ${totals.maths}  |  Mocks: ${totals.mocks}`;

  // entries list
  entriesWrap.innerHTML = '';
  if(list.length === 0){
    entriesWrap.innerHTML = '<div class="muted">No entries yet</div>';
  }else{
    list.slice().reverse().forEach(e=>{
      const div = document.createElement('div');
      div.className = 'entry';
      div.innerHTML = `<div>
        <div><strong>${e.date}</strong> <small class="muted">(${e.mocks} mocks)</small></div>
        <div class="muted">Phy ${e.physics} • Chem ${e.chemistry} • Math ${e.maths}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="badge" data-date="${e.date}">Edit</button>
        <button class="badge" data-delete="${e.date}">Delete</button>
      </div>`;
      entriesWrap.appendChild(div);
    });
    // attach handlers
    entriesWrap.querySelectorAll('[data-delete]').forEach(btn=> btn.addEventListener('click', ()=> {
      const d = btn.getAttribute('data-delete');
      if(confirm('Delete entry for ' + d + '?')) removeDate(d);
    }));
    entriesWrap.querySelectorAll('[data-date]').forEach(btn=> btn.addEventListener('click', ()=> {
      const d = btn.getAttribute('data-date');
      const found = list.find(x=> x.date === d);
      if(!found) return;
      dateInput.value = found.date;
      phy.value = found.physics;
      chem.value = found.chemistry;
      math.value = found.maths;
      mocks.value = found.mocks;
      window.scrollTo({top:0,behavior:'smooth'});
    }));
  }

  // chart
  const labels = list.map(x=> x.date);
  const dataPhy = list.map(x=> Number(x.physics||0));
  const dataChem = list.map(x=> Number(x.chemistry||0));
  const dataMath = list.map(x=> Number(x.maths||0));

  if(window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx, {
    type:'line',
    data:{
      labels: labels,
      datasets:[
        {label:'Physics', data:dataPhy, borderColor:'#7c3aed', tension:0.2, fill:false},
        {label:'Chemistry', data:dataChem, borderColor:'#06b6d4', tension:0.2, fill:false},
        {label:'Maths', data:dataMath, borderColor:'#10b981', tension:0.2, fill:false},
      ]
    },
    options:{
      responsive:true,
      interaction:{mode:'index', intersect:false},
      plugins:{legend:{position:'bottom'}},
      scales:{x:{ticks:{color:'#9aa7b8'}}, y:{ticks:{color:'#9aa7b8'}}}
    }
  });
}

render();
