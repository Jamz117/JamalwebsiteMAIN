document.addEventListener('DOMContentLoaded', function () {
  const pitchEl = document.getElementById('pitch');
  const hoursEl = document.getElementById('hours');
  const costEl = document.getElementById('cost');
  const form = document.getElementById('bookingForm');
  const pitchItems = document.querySelectorAll('.pitch-item');
  const dateEl = document.getElementById('date');

  function loadBookings() {
    try {
      return JSON.parse(localStorage.getItem('bookings') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveBookings(list) {
    localStorage.setItem('bookings', JSON.stringify(list));
  }

  function getRate() {
    const opt = pitchEl.selectedOptions[0];
    return Number(opt.dataset.rate) || 0;
  }

  function isBooked(pitch, date) {
    if (!date) return false;
    const bookings = loadBookings();
    return bookings.some(b => b.pitch === pitch && b.date === date);
  }

  function refreshAvailability() {
    const date = dateEl.value;
    // update pitch items
    pitchItems.forEach(item => {
      const pitch = item.dataset.pitch;
      const already = isBooked(pitch, date);
      item.classList.toggle('unavailable', already);
      // badge
      let badge = item.querySelector('.badge-unavailable');
      if (already) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'badge-unavailable';
          badge.textContent = 'Already Booked';
          item.appendChild(badge);
        }
      } else {
        if (badge) badge.remove();
      }
    });

    // disable options in select for booked pitches on that date
    for (let i = 0; i < pitchEl.options.length; i++) {
      const opt = pitchEl.options[i];
      opt.disabled = isBooked(opt.value, date);
    }

    // if current selection is now unavailable, pick first available
    if (pitchEl.selectedOptions[0] && pitchEl.selectedOptions[0].disabled) {
      for (let i = 0; i < pitchEl.options.length; i++) {
        if (!pitchEl.options[i].disabled) {
          pitchEl.selectedIndex = i;
          break;
        }
      }
    }
  }

  function highlightSelectedPitch() {
    const val = pitchEl.value;
    pitchItems.forEach(item => {
      item.classList.toggle('active', item.dataset.pitch === val);
    });
  }

  function updateCost() {
    let hours = parseInt(hoursEl.value, 10) || 0;
    if (hours > 4) {
      hours = 4;
      hoursEl.value = '4';
    }
    if (hours < 1) {
      hours = 1;
      hoursEl.value = '1';
    }
    const total = getRate() * hours;
    costEl.textContent = `£${total}`;
    highlightSelectedPitch();
  }

  // clicking a pitch item selects it in the form (unless unavailable)
  pitchItems.forEach(item => {
    item.addEventListener('click', () => {
      if (item.classList.contains('unavailable')) {
        alert('This pitch is already booked for the selected date.');
        return;
      }
      const target = item.dataset.pitch;
      for (let i = 0; i < pitchEl.options.length; i++) {
        if (pitchEl.options[i].value === target) {
          pitchEl.selectedIndex = i;
          break;
        }
      }
      updateCost();
    });
  });

  pitchEl.addEventListener('change', () => {
    updateCost();
  });
  hoursEl.addEventListener('input', updateCost);
  dateEl.addEventListener('change', () => {
    refreshAvailability();
    updateCost();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const date = dateEl.value;
    const startTime = document.getElementById('startTime').value;
    const hours = parseInt(hoursEl.value, 10) || 0;
    const pitch = pitchEl.value;

    if (!date || !startTime) {
      alert('Please select a date and start time.');
      return;
    }
    if (hours < 1 || hours > 4) {
      alert('Duration must be between 1 and 4 hours.');
      return;
    }

    if (isBooked(pitch, date)) {
      alert('Sorry — that pitch is already booked on this date.');
      refreshAvailability();
      return;
    }

    const bookings = loadBookings();
    bookings.push({ pitch: pitch, date: date, start: startTime, hours: hours });
    saveBookings(bookings);

    const pitchName = pitchEl.selectedOptions[0].textContent;
    const total = getRate() * hours;
    alert(`Booking confirmed:\n${pitchName}\nDate: ${date}\nStart: ${startTime}\nDuration: ${hours} hour(s)\nTotal: £${total}`);
    form.reset();
    refreshAvailability();
    updateCost();
  });

  // initial setup
  refreshAvailability();
  updateCost();
});
