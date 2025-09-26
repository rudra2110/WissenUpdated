const countrySelect = document.getElementById('countrySelect');
const yearInput = document.getElementById('yearInput');
const loadBtn = document.getElementById('loadBtn');
const calendarContainer = document.getElementById('calendarContainer');
const toggleViewBtn = document.getElementById('toggleViewBtn');

// Holiday-week filter
const holidayWeeksOnlyBtn = document.createElement("button");
holidayWeeksOnlyBtn.textContent = "Show Only Holiday Weeks";
holidayWeeksOnlyBtn.className = "toggle-holiday-btn";
document.getElementById("controls").appendChild(holidayWeeksOnlyBtn);

// Navigation buttons
const navLeftBtn = document.createElement("button");
navLeftBtn.textContent = "⟵";
navLeftBtn.className = "nav-btn";
const navRightBtn = document.createElement("button");
navRightBtn.textContent = "⟶";
navRightBtn.className = "nav-btn";
document.getElementById("controls").appendChild(navLeftBtn);
document.getElementById("controls").appendChild(navRightBtn);

let currentView = 'monthly';
const today = new Date();
yearInput.value = today.getFullYear();
let currentMonth = today.getMonth();
let currentQuarter = Math.floor(today.getMonth() / 3);
let onlyHolidayWeeks = false;

toggleViewBtn.addEventListener('click', () => {
  currentView = currentView === 'monthly' ? 'quarterly' : 'monthly';
  toggleViewBtn.textContent = currentView === 'monthly' ? 'Quarterly View' : 'Monthly View';
  renderEmpty();
  loadHolidays();
});

holidayWeeksOnlyBtn.addEventListener("click", () => {
  onlyHolidayWeeks = !onlyHolidayWeeks;
  holidayWeeksOnlyBtn.textContent = onlyHolidayWeeks
    ? "Show All Weeks"
    : "Show Only Holiday Weeks";
  renderEmpty();
  loadHolidays();
});

loadBtn.addEventListener('click', loadHolidays);
navLeftBtn.addEventListener('click', () => {
  if (currentView === 'monthly') {
    currentMonth = (currentMonth - 1 + 12) % 12;
    if (currentMonth === 11) yearInput.value = parseInt(yearInput.value) - 1;
  } else {
    currentQuarter = (currentQuarter - 1 + 4) % 4;
    if (currentQuarter === 3) yearInput.value = parseInt(yearInput.value) - 1;
  }
  loadHolidays();
});
navRightBtn.addEventListener('click', () => {
  if (currentView === 'monthly') {
    currentMonth = (currentMonth + 1) % 12;
    if (currentMonth === 0) yearInput.value = parseInt(yearInput.value) + 1;
  } else {
    currentQuarter = (currentQuarter + 1) % 4;
    if (currentQuarter === 0) yearInput.value = parseInt(yearInput.value) + 1;
  }
  loadHolidays();
});

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

async function loadCountries() {
  try {
    const countries = await fetchJSON('/api/available-countries');
    countries.sort((a, b) => a.name.localeCompare(b.name));
    countrySelect.innerHTML = countries
      .map(c => `<option value="${c.countryCode}">${c.name} (${c.countryCode})</option>`)
      .join('');
    const preferred = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1];
    if (preferred) {
      const opt = Array.from(countrySelect.options).find(o => o.value === preferred);
      if (opt) opt.selected = true;
    }
  } catch (e) {
    countrySelect.innerHTML = '<option value="US">United States (US)</option>';
  }
}

function renderEmpty() {
  calendarContainer.innerHTML = '';
  calendarContainer.className = currentView;
}
function monthName(m) { return new Date(2020, m, 1).toLocaleString(undefined, { month: 'long' }); }

function getWeeksForMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const weeks = [];
  let cur = new Date(first);
  cur.setDate(cur.getDate() - cur.getDay());
  while (cur <= last || cur.getDay() !== 0) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(cur.getMonth() === month ? new Date(cur) : null);
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    }
    weeks.push(week);
    if (cur.getMonth() > month && cur.getFullYear() === year) break;
    if (cur.getFullYear() > year && month === 11) break;
  }
  return weeks;
}

function isoDate(d) { if (!d) return null; return d.toISOString().slice(0, 10); }
function groupHolidaysByDate(holidays) {
  const map = {};
  for (const h of holidays) {
    map[h.date] = map[h.date] || [];
    map[h.date].push(h.localName || h.name);
  }
  return map;
}

// Check if week has two consecutive holiday days
function hasAdjacentHolidays(weekDates, holidayMap) {
  for (let i = 0; i < weekDates.length - 1; i++) {
    const d1 = weekDates[i], d2 = weekDates[i + 1];
    if (d1 && d2 && holidayMap[isoDate(d1)] && holidayMap[isoDate(d2)]) return true;
  }
  return false;
}

async function loadHolidays() {
  try {
    renderEmpty();
    const country = countrySelect.value || 'US';
    const year = parseInt(yearInput.value) || today.getFullYear();
    const holidays = await fetchJSON(`/api/holidays?country=${country}&year=${year}`);
    const map = groupHolidaysByDate(holidays);

    if (currentView === 'monthly') renderMonth(year, currentMonth, map);
    else {
      const months = [currentQuarter * 3, currentQuarter * 3 + 1, currentQuarter * 3 + 2];
      renderQuarter(year, months, map);
    }
  } catch (e) {
    calendarContainer.innerHTML =
      '<div class="month-card"><div class="month-header"><strong>Error loading holidays.</strong></div><div class="footer-note">Make sure you have internet and the backend can reach the public holidays API.</div></div>';
    console.error(e);
  }
}

function renderMonth(year, m, map) {
  const card = document.createElement('div');
  card.className = 'month-card';
  const header = document.createElement('div');
  header.className = 'month-header';
  header.innerHTML = `<strong>${monthName(m)} ${year}</strong>`;
  card.appendChild(header);

  const weeks = getWeeksForMonth(year, m);
  const frag = document.createDocumentFragment();

  weeks.forEach(weekDates => {
    const holidayDaysCount = weekDates.reduce(
      (acc, d) => acc + (d && map[isoDate(d)] ? 1 : 0),
      0
    );
    if (onlyHolidayWeeks && holidayDaysCount === 0) return;

    const weekEl = document.createElement('div');
    if (hasAdjacentHolidays(weekDates, map)) weekEl.className = 'week adjacent-holidays';
    else weekEl.className = 'week ' + (holidayDaysCount === 1 ? 'light' : holidayDaysCount > 1 ? 'dark' : '');

    weekDates.forEach(d => {
      const day = document.createElement('div'); day.className = 'day';
      if (!d) day.innerHTML = '';
      else {
        day.innerHTML = `<div class="date">${d.getDate()}</div>`;
        if (d.toDateString() === today.toDateString()) day.classList.add('today');
        const hd = map[isoDate(d)];
        if (hd) {
          const dot = document.createElement('span'); dot.className = 'holiday-dot';
          const tooltip = document.createElement('span'); tooltip.className = 'holiday-tooltip'; tooltip.textContent = hd.join(', ');
          day.appendChild(dot); day.appendChild(tooltip);
          dot.addEventListener('click', (e) => { e.stopPropagation(); alert(hd.join(', ')); });
        }
      }
      weekEl.appendChild(day);
    });
    frag.appendChild(weekEl);
  });
  card.appendChild(frag);
  calendarContainer.appendChild(card);
}

function renderQuarter(year, months, map) {
  const wrapper = document.createElement('div');
  wrapper.className = 'quarter-wrapper';

  months.forEach(m => {
    const card = document.createElement('div'); card.className = 'month-card';
    const header = document.createElement('div'); header.className = 'month-header';
    header.innerHTML = `<strong>${monthName(m)} ${year}</strong>`; card.appendChild(header);

    const weeks = getWeeksForMonth(year, m);
    const frag = document.createDocumentFragment();

    weeks.forEach(weekDates => {
      const holidayDaysCount = weekDates.reduce(
        (acc, d) => acc + (d && map[isoDate(d)] ? 1 : 0),
        0
      );
      if (onlyHolidayWeeks && holidayDaysCount === 0) return;

      const weekEl = document.createElement('div');
      if (hasAdjacentHolidays(weekDates, map)) weekEl.className = 'week adjacent-holidays';
      else weekEl.className = 'week ' + (holidayDaysCount === 1 ? 'light' : holidayDaysCount > 1 ? 'dark' : '');

      weekDates.forEach(d => {
        const day = document.createElement('div'); day.className = 'day';
        if (!d) day.innerHTML = '';
        else {
          day.innerHTML = `<div class="date">${d.getDate()}</div>`;
          if (d.toDateString() === today.toDateString()) day.classList.add('today');
          const hd = map[isoDate(d)];
          if (hd) {
            const dot = document.createElement('span'); dot.className = 'holiday-dot';
            const tooltip = document.createElement('span'); tooltip.className = 'holiday-tooltip'; tooltip.textContent = hd.join(', ');
            day.appendChild(dot); day.appendChild(tooltip);
            dot.addEventListener('click', (e) => { e.stopPropagation(); alert(hd.join(', ')); });
          }
        }
        weekEl.appendChild(day);
      });
      frag.appendChild(weekEl);
    });
    card.appendChild(frag);
    wrapper.appendChild(card);
  });
  calendarContainer.appendChild(wrapper);
}

// Initialize
loadCountries().then(loadHolidays);


// Create a app i will give prompt for you