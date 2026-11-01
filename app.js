(() => {
  'use strict';

  const METHODS = {
    v60: {
      id: 'v60',
      name: 'V60 Cone',
      defaultRatio: 16,
      minRatio: 13,
      maxRatio: 18,
      defaultCoffee: 18,
      grind: 'Medium-Fine (table salt)',
      temp: '200°F - 205°F (93°C - 96°C)',
      targetTime: 180,
      steps: [
        { time: 0, title: 'Bloom / Pre-infusion', desc: 'Pour ~50g hot water in gentle circles. Let degas for 45 seconds.' },
        { time: 45, title: 'First Main Pour (60%)', desc: 'Pour continuously in outward spirals until scale reaches ~60% of total water.' },
        { time: 90, title: 'Second Pour (100%)', desc: 'Pour remaining water with smooth, steady stream.' },
        { time: 135, title: 'Drawdown', desc: 'Allow gravity to filter through the coffee bed until 3:00.' }
      ]
    },
    chemex: {
      id: 'chemex',
      name: 'Chemex',
      defaultRatio: 16,
      minRatio: 14,
      maxRatio: 17,
      defaultCoffee: 30,
      grind: 'Medium-Coarse',
      temp: '202°F - 206°F (94°C - 96°C)',
      targetTime: 240,
      steps: [
        { time: 0, title: 'Bloom / Pre-infusion', desc: 'Pour ~75g water without hitting paper filter edges. Wait 45 seconds.' },
        { time: 45, title: 'First Spiral Pour', desc: 'Pour in slow spirals, keeping water level 1 inch below Chemex rim.' },
        { time: 130, title: 'Second Pour to Total', desc: 'Top up remaining water and let settle.' },
        { time: 195, title: 'Final Drawdown', desc: 'Allow coffee to drip completely through thick filter until flat bed.' }
      ]
    },
    aeropress: {
      id: 'aeropress',
      name: 'AeroPress',
      defaultRatio: 13,
      minRatio: 10,
      maxRatio: 16,
      defaultCoffee: 15,
      grind: 'Medium (fine sea salt)',
      temp: '185°F - 195°F (85°C - 90°C)',
      targetTime: 120,
      steps: [
        { time: 0, title: 'Fast Pour', desc: 'Pour all water in 15 seconds. Stir 3 times with paddle.' },
        { time: 30, title: 'Steep & Seal', desc: 'Insert plunger slightly to create vacuum seal. Wait until 1:15.' },
        { time: 75, title: 'Gentle Press', desc: 'Press down gently and steadily for 30–45 seconds until hiss.' }
      ]
    },
    frenchpress: {
      id: 'frenchpress',
      name: 'French Press',
      defaultRatio: 14,
      minRatio: 11,
      maxRatio: 16,
      defaultCoffee: 30,
      grind: 'Coarse (kosher salt)',
      temp: '200°F - 205°F (93°C - 96°C)',
      targetTime: 240,
      steps: [
        { time: 0, title: 'Full Pour & Saturate', desc: 'Pour all water, saturating grounds completely.' },
        { time: 60, title: 'Break the Crust', desc: 'Gently stir crust of coffee floating on surface.' },
        { time: 210, title: 'Plunge & Pour', desc: 'Press plunger down slowly. Pour immediately into mugs.' }
      ]
    },
    coldbrew: {
      id: 'coldbrew',
      name: 'Cold Brew Concentrate',
      defaultRatio: 8,
      minRatio: 5,
      maxRatio: 10,
      defaultCoffee: 80,
      grind: 'Extra Coarse',
      temp: 'Chilled / Room Temp (60°F - 70°F)',
      targetTime: 43200, // 12 hours
      steps: [
        { time: 0, title: 'Mix & Saturate', desc: 'Combine coarse grounds with cool filtered water in pitcher.' },
        { time: 1, title: '12–16 Hour Steep', desc: 'Leave in refrigerator or cool pantry for 12 to 18 hours.' },
        { time: 2, title: 'Strain & Filter', desc: 'Filter through fine mesh or paper filter. Dilute 1:1 with water or milk.' }
      ]
    }
  };

  let state = {
    method: 'v60',
    mode: 'by-coffee',
    coffeeGrams: 18,
    waterMl: 288,
    ratio: 16,
    timerRunning: false,
    timerSeconds: 0,
    timerInterval: null
  };

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  function calculate() {
    const m = METHODS[state.method];
    if (state.mode === 'by-coffee') {
      state.waterMl = Math.round(state.coffeeGrams * state.ratio);
    } else {
      state.coffeeGrams = Math.round((state.waterMl / state.ratio) * 10) / 10;
    }
  }

  function render() {
    calculate();
    const m = METHODS[state.method];

    $('#disp-coffee').textContent = state.coffeeGrams;
    $('#disp-coffee-oz').textContent = `~${(state.coffeeGrams / 28.35).toFixed(2)} oz`;
    $('#disp-water').textContent = state.waterMl;
    const flOz = (state.waterMl / 29.57).toFixed(1);
    const mugs = (state.waterMl / 300).toFixed(1);
    $('#disp-water-oz').textContent = `~${flOz} fl oz (${mugs} mug${mugs === '1.0' ? '' : 's'})`;

    $('#spec-grind').textContent = m.grind;
    $('#spec-temp').textContent = m.temp;
    const mins = Math.floor(m.targetTime / 60);
    const secs = m.targetTime % 60;
    $('#spec-time').textContent = m.id === 'coldbrew' ? '12–16 Hours' : `${mins}:${secs < 10 ? '0' : ''}${secs} mins`;
    $('#timer-target').textContent = `/ ${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

    $('#ratio-label').textContent = `1:${state.ratio}`;

    // Timeline steps
    const timeline = $('#brew-timeline');
    timeline.innerHTML = '';
    m.steps.forEach((s, idx) => {
      const stepEl = document.createElement('div');
      stepEl.className = 'timeline-step';
      if (state.timerSeconds >= s.time) stepEl.classList.add('active');
      const stepMins = Math.floor(s.time / 60);
      const stepSecs = s.time % 60;
      stepEl.innerHTML = `
        <div class="step-time">${stepMins}:${stepSecs < 10 ? '0' : ''}${stepSecs}</div>
        <div class="step-info">
          <strong>${s.title}</strong>
          <p>${s.desc}</p>
        </div>
      `;
      timeline.appendChild(stepEl);
    });
  }

  // Timer logic
  function updateTimer() {
    state.timerSeconds++;
    const m = Math.floor(state.timerSeconds / 60);
    const s = state.timerSeconds % 60;
    $('#timer-clock').textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

    // Update active step description
    const curMethod = METHODS[state.method];
    let curStep = curMethod.steps[0];
    for (let i = 0; i < curMethod.steps.length; i++) {
      if (state.timerSeconds >= curMethod.steps[i].time) {
        curStep = curMethod.steps[i];
      }
    }
    $('#timer-step-desc').innerHTML = `<strong>${curStep.title}:</strong> ${curStep.desc}`;

    render();
  }

  function toggleTimer() {
    const btn = $('#btn-timer-toggle');
    if (!state.timerRunning) {
      state.timerRunning = true;
      btn.textContent = 'Pause';
      btn.classList.add('paused');
      state.timerInterval = setInterval(updateTimer, 1000);
    } else {
      state.timerRunning = false;
      btn.textContent = 'Resume';
      btn.classList.remove('paused');
      clearInterval(state.timerInterval);
    }
  }

  function resetTimer() {
    state.timerRunning = false;
    clearInterval(state.timerInterval);
    state.timerSeconds = 0;
    $('#timer-clock').textContent = '00:00';
    $('#timer-step-desc').textContent = 'Press Start when ready to pour hot water.';
    const btn = $('#btn-timer-toggle');
    btn.textContent = 'Start Timer';
    btn.classList.remove('paused');
    render();
  }

  // Bind Events
  document.addEventListener('DOMContentLoaded', () => {
    $$('.method-tab').forEach(tab => {
      tab.onclick = () => {
        $$('.method-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.method = tab.dataset.method;
        const m = METHODS[state.method];
        state.ratio = m.defaultRatio;
        state.coffeeGrams = m.defaultCoffee;
        $('#ratio-slider').value = state.ratio;
        $('#coffee-input').value = state.coffeeGrams;
        resetTimer();
        render();
      };
    });

    $('#calc-mode').onchange = e => {
      state.mode = e.target.value;
      if (state.mode === 'by-coffee') {
        $('#coffee-input').value = state.coffeeGrams;
      } else {
        $('#coffee-input').value = state.waterMl;
      }
      render();
    };

    $('#coffee-input').oninput = e => {
      const val = parseFloat(e.target.value) || 0;
      if (state.mode === 'by-coffee') {
        state.coffeeGrams = val;
      } else {
        state.waterMl = val;
      }
      render();
    };

    $('#ratio-slider').oninput = e => {
      state.ratio = parseInt(e.target.value, 10);
      render();
    };

    $('#btn-timer-toggle').onclick = toggleTimer;
    $('#btn-timer-reset').onclick = resetTimer;

    render();
  });
})();
