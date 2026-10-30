let editingIndex = null;
let justDuplicated = false;
let GRID_START_HOUR = 7;
let lastKnownDay = new Date().getDay();
const overlay = document.getElementById('form-overlay');

const savedColors = JSON.parse(localStorage.getItem('categoryColors') || '{}');
const categories = ['study', 'work', 'sport', 'creativity', 'freetime', 'meal', 'health', 'rest'];

categories.forEach(cat => {
  if (savedColors[cat]) {
    document.documentElement.style.setProperty(`--color-${cat}`, savedColors[cat]);
}});

function openSettingsForm() {
  categories.forEach(cat => {
    const currentColor = getComputedStyle(document.documentElement).getPropertyValue(`--color-${cat}`).trim();
    document.getElementById(`color-${cat}`).value = currentColor;
  });
  document.getElementById('settings-overlay').hidden = false;
}

const savedStart = localStorage.getItem('gridStartHour');
  if (savedStart !== null) {
    GRID_START_HOUR = parseInt(savedStart, 10);
    document.getElementById('grid-start-select').value = GRID_START_HOUR;
  }

function ConvertTimeString(TimeString) {
  const parts = TimeString.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours + minutes / 60;
}

function ComputeBlockPosition(startString, endString, gridStartHour, hourHeight) {
  const start = ConvertTimeString(startString);
  const end = ConvertTimeString(endString);
  const top = (start - gridStartHour) * hourHeight;
  const height = (end - start) * hourHeight; 
  return { top, height };
}

let activities = [];

function UpdateTimers() {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const todayIndex = now.getDay();  
  const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayString = daysMap[todayIndex];
  const blocks = document.querySelectorAll('.block');
  
  blocks.forEach(block => {
    const timerElement = block.querySelector('.timer');
    if (!timerElement) return;
    const parentColumn = block.closest('.day-column');
    const blockDay = parentColumn.dataset.day;
    if (blockDay !== todayString) {
      timerElement.textContent = "";
      return; 
    }
    const startNumber = ConvertTimeString(block.dataset.start);
    const endNumber = ConvertTimeString(block.dataset.end); 
    if (currentHour < startNumber) { 
      timerElement.textContent = "non cominciato";
    } 
    else if (currentHour >= startNumber && currentHour < endNumber) {
      const timeLeft = endNumber - currentHour;
      const hoursLeft = Math.floor(timeLeft);
      const minutesLeft = Math.round((timeLeft - hoursLeft) * 60);
      if (hoursLeft === 0) {
        timerElement.textContent = `cominciato: ${minutesLeft}min rimanenti`;
      } else {
        timerElement.textContent = `cominciato: ${hoursLeft}h ${minutesLeft}min rimanenti`;
      }
    } 
    else { 
      timerElement.textContent = "terminato";
}});}

function RenderActivities() {
  const hourHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--hour-height')
  );

  document.querySelectorAll('.day-body').forEach(body => {
    body.querySelectorAll('.block').forEach(block => block.remove());
  });

  activities.forEach((activity, index) => {
    const column = document.querySelector(`.day-column[data-day="${activity.day}"]`);
    const body = column.querySelector('.day-body');
    const block = document.createElement('div');
    block.className = 'block';
    block.classList.add('cat-' + activity.category);
    block.dataset.start = activity.start;
    block.dataset.end = activity.end;
    block.dataset.index = index;
    const duration = (ConvertTimeString(activity.end) - ConvertTimeString(activity.start)) * 60;
    block.innerHTML = activity.name + '<br>' + duration + "min";
    const timer = document.createElement('span');
    timer.className = 'timer';
    block.appendChild(timer);
    body.appendChild(block);
    
    const pos = ComputeBlockPosition(activity.start, activity.end, GRID_START_HOUR, hourHeight);
    block.style.top = pos.top + 'px';
    block.style.height = pos.height + 'px';
  });
}

function RenderCurrentTimeLine() {
  document.querySelectorAll('.current-time-line').forEach(el => el.remove());
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  if (currentHour < GRID_START_HOUR || currentHour > 23) return;
  const hourHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--hour-height')
  );
  const top = (currentHour - GRID_START_HOUR) * hourHeight;
  const todayIndex = new Date().getDay();  
  const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayString = daysMap[todayIndex];
  const todayColumn = document.querySelector(`.day-column[data-day="${todayString}"]`);
  if (!todayColumn) return;  
  const body = todayColumn.querySelector('.day-body');
  const line = document.createElement('div');
  line.className = 'current-time-line';
  line.style.top = top + 'px';
  body.appendChild(line);
}

function RenderTimeColumn() {
  const timeColumn = document.querySelector('.time-column');
  const header = timeColumn.querySelector('.time-header');
  timeColumn.innerHTML = '';
  if (header) timeColumn.appendChild(header);
  for (let hour = GRID_START_HOUR; hour <= 23; hour++) {
    const span = document.createElement('span');
    const formattedHour = String(hour).padStart(2, '0') + ':00';
    span.textContent = formattedHour;
    timeColumn.appendChild(span);
  }
}

document.getElementById('mode-btn').addEventListener('click', () => {
  const gridElement = document.getElementById('grid');
  if (gridElement.classList.contains('single-day-view')) {
    gridElement.classList.remove('single-day-view');
    document.getElementById('mode-btn').textContent = "Giornata";
  } 
  else {
    gridElement.classList.add('single-day-view');
    document.getElementById('mode-btn').textContent = "Settimana";
  }
});

document.getElementById('grid-start-select').addEventListener('change', (e) => {
  GRID_START_HOUR = parseInt(e.target.value, 10);
  localStorage.setItem('gridStartHour', GRID_START_HOUR);
  RenderTimeColumn();
  RenderActivities();
  UpdateTimers();
  RenderCurrentTimeLine();
});
document.getElementById('add-btn').addEventListener('click', () => {
  overlay.hidden = false;
  document.getElementById('delete-btn').hidden = true;
  document.getElementById('duplicate-btn').hidden = true;
});
document.getElementById('cancel-btn').addEventListener('click', () => {overlay.hidden = true;} );
document.getElementById('save-btn').addEventListener('click', () => {
  const name = document.getElementById('input-name').value;
  const day = document.getElementById('input-day').value;
  const start = document.getElementById('input-start').value;
  const end = document.getElementById('input-end').value;
  const category = document.getElementById('input-category').value;
  
  if (name.trim() === '') {
    alert("Inserisci un nome per l'attività.");
    return;
  }

  if (start === '' || end === '') {
    alert("Inserisci un orario di inizio e di fine.");
    return;
  }

  if (ConvertTimeString(end) <= ConvertTimeString(start)) {
    alert("L'orario di fine deve essere successivo a quello di inizio.");
    return;
  }
  
  const newObject = {name, day, start, end, category};
  if (editingIndex === null) { activities.push(newObject); } 
  else { activities[editingIndex] = newObject; }
  editingIndex = null;
  overlay.hidden = true;
  localStorage.setItem('activities', JSON.stringify(activities));
  RenderActivities();
  UpdateTimers();
  document.getElementById('input-name').value = '';
  document.getElementById('input-start').value = '';
  document.getElementById('input-end').value = '';
  document.getElementById('input-day').selectedIndex = 0;
  document.getElementById('input-category').selectedIndex = 0;
} );

function openEditForm(index) {
  const activity = activities[index];
  document.getElementById('input-name').value = activity.name;
  document.getElementById('input-day').value = activity.day;
  document.getElementById('input-start').value = activity.start;
  document.getElementById('input-end').value = activity.end;
  document.getElementById('input-category').value = activity.category;
  editingIndex = index;
  overlay.hidden = false;
  document.getElementById('delete-btn').hidden = false;
  if (justDuplicated) {
    document.getElementById('duplicate-btn').hidden = true;
    justDuplicated = false; // Resetta il flag per la prossima volta
  } else {
    document.getElementById('duplicate-btn').hidden = false;
  }
}

document.getElementById('grid').addEventListener('click', (e) => {
  if (e.target.classList.contains('block')) {
    const index = parseInt(e.target.dataset.index, 10);
    openEditForm(index);
  }
});

document.getElementById('settings-btn').addEventListener('click', openSettingsForm);
document.getElementById('settings-cancel-btn').addEventListener('click', () => {
  document.getElementById('settings-overlay').hidden = true;
});

document.getElementById('settings-save-btn').addEventListener('click', () => {
  const newColors = {};
  categories.forEach(cat => {
    const color = document.getElementById(`color-${cat}`).value;
    newColors[cat] = color;
    document.documentElement.style.setProperty(`--color-${cat}`, color);
  });
  localStorage.setItem('categoryColors', JSON.stringify(newColors));
  document.getElementById('settings-overlay').hidden = true;
});

document.getElementById('duplicate-btn').addEventListener('click', () => {
  if (editingIndex === null) return;
  const original = activities[editingIndex];
  const copy = { ...original, name: original.name };
  activities.push(copy);
  editingIndex = null;
  overlay.hidden = true;
  localStorage.setItem('activities', JSON.stringify(activities));
  RenderActivities();
  UpdateTimers();
  justDuplicated = true;
  openEditForm(activities.length - 1);
});

document.getElementById('delete-btn').addEventListener('click', () => {
  if (editingIndex === null) return;
  activities.splice(editingIndex, 1);
  editingIndex = null;
  overlay.hidden = true;
  localStorage.setItem('activities', JSON.stringify(activities));
  RenderActivities();
  UpdateTimers();
});

RenderTimeColumn();
RenderActivities();
UpdateTimers();
RenderCurrentTimeLine();

function setActiveDay(day) {
  document.querySelectorAll('.day-btn').forEach(btn => {
    if (btn.dataset.day === day) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.day-column').forEach(col => {
    if (col.dataset.day === day) {
      col.classList.add('active');
    } else {
      col.classList.remove('active');
    }
  });
}

document.querySelectorAll('.day-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setActiveDay(btn.dataset.day);
  });
});

const todayIndex = new Date().getDay();
const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
setActiveDay(daysMap[todayIndex]);

const todayColumn = document.querySelector(`.day-column[data-day="${daysMap[todayIndex]}"]`);
if (todayColumn) {
  todayColumn.classList.add('is-today');
}

setInterval(() => {
  const currentDay = new Date().getDay();
    if (currentDay !== lastKnownDay) {
    lastKnownDay = currentDay;
    const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    setActiveDay(daysMap[currentDay]);
    document.querySelectorAll('.day-column').forEach(col => col.classList.remove('is-today'));
    const todayColumn = document.querySelector(`.day-column[data-day="${daysMap[currentDay]}"]`);
    if (todayColumn) todayColumn.classList.add('is-today');
  }
  RenderCurrentTimeLine();
  UpdateTimers();
}, 60000);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrato!', reg))
      .catch(err => console.log('Errore SW:', err));
  });
}