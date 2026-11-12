/**
 * F2 Kalkulator Neumorphism
 * - Dua Tema: Ungu Light & Coklat Dark
 * - Layar Dua Baris: Ekspresi & Input/Hasil Utama
 * - Dukungan Klik & Keyboard Fisik
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Elemen DOM ---
  const currentDisplay = document.getElementById('currentDisplay');
  const expressionDisplay = document.getElementById('expressionDisplay');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeLabel');
  const buttons = document.querySelectorAll('.neumorph-btn');

  // --- State Kalkulator ---
  let currentValue = '0';
  let previousValue = null;
  let currentOperator = null;
  let isResultState = false; // Menandai jika layar sedang menampilkan hasil final

  // =========================================================================
  // PENGELOLA TEMA (Ungu Light & Coklat Dark)
  // =========================================================================
  const THEME_PURPLE = 'theme-purple-light';
  const THEME_BROWN = 'theme-brown-dark';
  const metaThemeColor = document.getElementById('metaThemeColor');

  function applyTheme(theme) {
    if (theme === THEME_BROWN) {
      document.body.classList.remove(THEME_PURPLE);
      document.body.classList.add(THEME_BROWN);
      themeLabel.textContent = 'Ungu Light';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#f3ede4');
    } else {
      document.body.classList.remove(THEME_BROWN);
      document.body.classList.add(THEME_PURPLE);
      themeLabel.textContent = 'Coklat Dark';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#1e1333');
    }
    localStorage.setItem('f2calc_theme', theme);
  }

  // Muat tema yang tersimpan
  const savedTheme = localStorage.getItem('f2calc_theme') || THEME_PURPLE;
  applyTheme(savedTheme);

  // Toggle tema saat tombol diklik
  themeToggleBtn.addEventListener('click', () => {
    const isBrown = document.body.classList.contains(THEME_BROWN);
    applyTheme(isBrown ? THEME_PURPLE : THEME_BROWN);
  });

  // =========================================================================
  // LOGIKA TAMPILAN (DISPLAY & FONT RESIZING)
  // =========================================================================
  function updateDisplay() {
    currentDisplay.textContent = currentValue;

    // Bersihkan kelas ukuran font dinamis
    currentDisplay.classList.remove('shrink-sm', 'shrink-md', 'shrink-lg');

    const len = currentValue.length;
    if (len > 15) {
      currentDisplay.classList.add('shrink-lg');
    } else if (len > 12) {
      currentDisplay.classList.add('shrink-md');
    } else if (len > 9) {
      currentDisplay.classList.add('shrink-sm');
    }

    // Update active state visual untuk tombol operator
    document.querySelectorAll('.key-operator').forEach((btn) => {
      if (currentOperator && btn.dataset.operator === currentOperator && !isResultState) {
        btn.classList.add('active-op');
      } else {
        btn.classList.remove('active-op');
      }
    });
  }

  function setExpression(text) {
    expressionDisplay.textContent = text;
  }

  // =========================================================================
  // LOGIKA MATEMATIKA KALKULATOR
  // =========================================================================
  function formatNumber(num) {
    if (isNaN(num) || !isFinite(num)) return 'Error';
    // Menghilangkan masalah presisi floating point JS (misal 0.1 + 0.2 = 0.30000000000000004)
    const rounded = parseFloat(num.toPrecision(12));
    return rounded.toString();
  }

  function handleNumber(numStr) {
    if (currentValue === 'Error') {
      currentValue = numStr;
      isResultState = false;
    } else if (isResultState) {
      // Jika baru saja menekan '=', mulai input angka baru
      currentValue = numStr;
      isResultState = false;
      setExpression('');
    } else {
      if (currentValue === '0') {
        currentValue = numStr;
      } else {
        if (currentValue.length < 16) {
          currentValue += numStr;
        }
      }
    }
    updateDisplay();
  }

  function handleDecimal() {
    if (currentValue === 'Error' || isResultState) {
      currentValue = '0.';
      isResultState = false;
      setExpression('');
    } else if (!currentValue.includes('.')) {
      currentValue += '.';
    }
    updateDisplay();
  }

  function handleOperator(op) {
    if (currentValue === 'Error') return;

    if (previousValue !== null && currentOperator && !isResultState) {
      // Ada operasi berantai yang belum dieksekusi (contoh: 5 + 3, lalu klik *)
      calculate(false);
    }

    previousValue = currentValue;
    currentOperator = op;
    isResultState = false;
    setExpression(`${previousValue} ${currentOperator}`);
    currentValue = '0';
    updateDisplay();
  }

  function calculate(isFinal = true) {
    if (previousValue === null || currentOperator === null || currentValue === 'Error') {
      return;
    }

    const prev = parseFloat(previousValue);
    const curr = parseFloat(currentValue);
    let result = 0;

    switch (currentOperator) {
      case '+':
        result = prev + curr;
        break;
      case '-':
        result = prev - curr;
        break;
      case '×':
        result = prev * curr;
        break;
      case '÷':
        if (curr === 0) {
          currentValue = 'Error';
          setExpression(`${prev} ÷ 0 =`);
          previousValue = null;
          currentOperator = null;
          isResultState = true;
          updateDisplay();
          return;
        }
        result = prev / curr;
        break;
      default:
        return;
    }

    const formattedResult = formatNumber(result);

    if (isFinal) {
      const exprText = `${previousValue} ${currentOperator} ${currentValue} =`;
      setExpression(exprText);
      currentValue = formattedResult;
      previousValue = null;
      currentOperator = null;
      isResultState = true;
      if (formattedResult !== 'Error') {
        saveToHistory(exprText, formattedResult);
      }
    } else {
      currentValue = formattedResult;
      previousValue = formattedResult;
    }

    updateDisplay();
  }

  function handleAllClear() {
    currentValue = '0';
    previousValue = null;
    currentOperator = null;
    isResultState = false;
    setExpression('');
    updateDisplay();
  }

  function handleDelete() {
    if (currentValue === 'Error' || isResultState) {
      handleAllClear();
      return;
    }

    if (currentValue.length > 1) {
      currentValue = currentValue.slice(0, -1);
      // Jika hanya tersisa minus "-", kembalikan ke 0
      if (currentValue === '-') {
        currentValue = '0';
      }
    } else {
      currentValue = '0';
    }
    updateDisplay();
  }

  function handlePercent() {
    if (currentValue === 'Error') return;
    const num = parseFloat(currentValue);
    const result = num / 100;
    const formattedResult = formatNumber(result);
    const exprText = `${num}% =`;
    currentValue = formattedResult;
    setExpression(exprText);
    isResultState = true;
    saveToHistory(exprText, formattedResult);
    updateDisplay();
  }

  function handleNegate() {
    if (currentValue === 'Error' || currentValue === '0') return;
    if (currentValue.startsWith('-')) {
      currentValue = currentValue.slice(1);
    } else {
      currentValue = '-' + currentValue;
    }
    updateDisplay();
  }

  // =========================================================================
  // PENGELOLA RIWAYAT PERHITUNGAN
  // =========================================================================
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyPanel = document.getElementById('historyPanel');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');

  let historyData = [];
  try {
    historyData = JSON.parse(localStorage.getItem('f2calc_history') || '[]');
  } catch (e) {
    historyData = [];
  }

  function saveToHistory(expression, result, broadcast = true) {
    const newItem = {
      expr: expression,
      result: result,
      id: Date.now()
    };
    historyData.unshift(newItem);
    if (historyData.length > 40) {
      historyData = historyData.slice(0, 40);
    }
    localStorage.setItem('f2calc_history', JSON.stringify(historyData));
    renderHistory();

    // Broadcast ke perangkat lain yang satu PIN
    if (broadcast && typeof broadcastCalculation === 'function') {
      broadcastCalculation(newItem);
    }
  }

  function renderHistory() {
    if (!historyList) return;
    historyList.innerHTML = '';

    if (historyData.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'history-empty';
      emptyDiv.innerHTML = `
        <span class="history-empty-icon">📝</span>
        <span>Belum ada riwayat perhitungan</span>
      `;
      historyList.appendChild(emptyDiv);
      return;
    }

    historyData.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';
      itemEl.title = 'Ketuk untuk menggunakan hasil ini';
      itemEl.innerHTML = `
        <div class="history-expr">${item.expr}</div>
        <div class="history-res">${item.result}</div>
      `;

      itemEl.addEventListener('click', () => {
        currentValue = item.result;
        previousValue = null;
        currentOperator = null;
        isResultState = true;
        setExpression(item.expr);
        updateDisplay();
        toggleHistory(false);
      });

      historyList.appendChild(itemEl);
    });
  }

  function toggleHistory(show) {
    if (!historyPanel) return;
    if (show === undefined) {
      historyPanel.classList.toggle('open');
    } else if (show) {
      historyPanel.classList.add('open');
    } else {
      historyPanel.classList.remove('open');
    }
    historyPanel.setAttribute('aria-hidden', !historyPanel.classList.contains('open'));
  }

  if (historyToggleBtn) {
    historyToggleBtn.addEventListener('click', () => toggleHistory());
  }
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', () => toggleHistory(false));
  }
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      historyData = [];
      localStorage.removeItem('f2calc_history');
      renderHistory();
      if (typeof broadcastClearHistory === 'function') {
        broadcastClearHistory();
      }
    });
  }

  // Render riwayat awal
  renderHistory();

  // =========================================================================
  // SINKRONISASI REAL-TIME PC & HP (PIN 4-DIGIT VIA MQTT)
  // =========================================================================
  const syncToggleBtn = document.getElementById('syncToggleBtn');
  const syncLabel = document.getElementById('syncLabel');
  const syncModal = document.getElementById('syncModal');
  const closeSyncModalBtn = document.getElementById('closeSyncModalBtn');
  const syncPinInput = document.getElementById('syncPinInput');
  const syncStatusMsg = document.getElementById('syncStatusMsg');
  const connectSyncBtn = document.getElementById('connectSyncBtn');
  const disconnectSyncBtn = document.getElementById('disconnectSyncBtn');

  const myClientId = 'f2_' + Math.random().toString(36).substring(2, 9);
  let mqttClient = null;
  let currentSyncPin = localStorage.getItem('f2calc_sync_pin') || null;

  function updateSyncUI(status, pin = null) {
    if (!syncToggleBtn) return;

    if (status === 'connected') {
      syncToggleBtn.classList.remove('connecting');
      syncToggleBtn.classList.add('connected');
      syncLabel.textContent = pin || currentSyncPin;
      if (disconnectSyncBtn) disconnectSyncBtn.style.display = 'block';
      if (connectSyncBtn) connectSyncBtn.textContent = 'Ganti PIN';
      if (syncStatusMsg) {
        syncStatusMsg.className = 'sync-status-msg success';
        syncStatusMsg.textContent = `🟢 Terhubung dengan PIN: ${pin || currentSyncPin}`;
      }
    } else if (status === 'connecting') {
      syncToggleBtn.classList.add('connecting');
      syncToggleBtn.classList.remove('connected');
      syncLabel.textContent = '...';
      if (syncStatusMsg) {
        syncStatusMsg.className = 'sync-status-msg info';
        syncStatusMsg.textContent = '🟡 Sedang menghubungkan...';
      }
    } else {
      syncToggleBtn.classList.remove('connecting', 'connected');
      syncLabel.textContent = 'Sinkron';
      if (disconnectSyncBtn) disconnectSyncBtn.style.display = 'none';
      if (connectSyncBtn) connectSyncBtn.textContent = 'Hubungkan';
      if (syncStatusMsg) {
        syncStatusMsg.className = 'sync-status-msg info';
        syncStatusMsg.textContent = 'Masukkan 4 digit PIN yang sama di PC & HP.';
      }
    }
  }

  function initSync(pin) {
    if (typeof mqtt === 'undefined') {
      if (syncStatusMsg) {
        syncStatusMsg.className = 'sync-status-msg error';
        syncStatusMsg.textContent = 'Modul sinkronisasi belum siap. Coba muat ulang.';
      }
      return;
    }

    if (mqttClient) {
      try {
        mqttClient.end(true);
      } catch (e) {}
    }

    currentSyncPin = pin;
    localStorage.setItem('f2calc_sync_pin', pin);
    updateSyncUI('connecting');

    const topic = `f2kalkulator/sync/room_${pin}`;
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

    try {
      mqttClient = mqtt.connect(brokerUrl, {
        clientId: myClientId,
        clean: true,
        connectTimeout: 7000,
        keepalive: 45
      });

      mqttClient.on('connect', () => {
        updateSyncUI('connected', pin);
        mqttClient.subscribe(topic, { qos: 0 });

        // Kirim salam & minta riwayat dari perangkat lain
        mqttClient.publish(topic, JSON.stringify({
          type: 'HELLO',
          senderId: myClientId,
          historyCount: historyData.length
        }));
      });

      mqttClient.on('message', (receivedTopic, payload) => {
        try {
          const data = JSON.parse(payload.toString());
          if (data.senderId === myClientId) return; // Abaikan pesan dari diri sendiri

          if (data.type === 'HELLO') {
            // Perangkat lain baru terhubung: jika kita punya riwayat, bagikan padanya
            if (historyData.length > 0) {
              mqttClient.publish(topic, JSON.stringify({
                type: 'SYNC_HISTORY_FULL',
                senderId: myClientId,
                history: historyData
              }));
            }
          } else if (data.type === 'SYNC_HISTORY_FULL' && Array.isArray(data.history)) {
            // Gabungkan riwayat dari perangkat pasangan (hindari duplikasi)
            const existingKeys = new Set(historyData.map((h) => `${h.expr}|${h.result}`));
            let hasNew = false;
            data.history.forEach((incoming) => {
              const key = `${incoming.expr}|${incoming.result}`;
              if (!existingKeys.has(key)) {
                historyData.push(incoming);
                existingKeys.add(key);
                hasNew = true;
              }
            });

            if (hasNew) {
              // Urutkan berdasarkan waktu/id terbaru
              historyData.sort((a, b) => (b.id || 0) - (a.id || 0));
              if (historyData.length > 40) historyData = historyData.slice(0, 40);
              localStorage.setItem('f2calc_history', JSON.stringify(historyData));
              renderHistory();
              notifyHistoryUpdate();
            }
          } else if (data.type === 'NEW_CALCULATION' && data.item) {
            // Perhitungan baru masuk dari perangkat lain
            historyData.unshift(data.item);
            if (historyData.length > 40) historyData = historyData.slice(0, 40);
            localStorage.setItem('f2calc_history', JSON.stringify(historyData));
            renderHistory();
            notifyHistoryUpdate();
          } else if (data.type === 'CLEAR_HISTORY') {
            // Perangkat lain menghapus riwayat
            historyData = [];
            localStorage.removeItem('f2calc_history');
            renderHistory();
          }
        } catch (err) {
          console.warn('Gagal memproses data sinkron:', err);
        }
      });

      mqttClient.on('error', (err) => {
        console.warn('MQTT error:', err);
        updateSyncUI('connecting');
      });

      mqttClient.on('offline', () => {
        updateSyncUI('connecting');
      });
    } catch (err) {
      console.error('Koneksi MQTT gagal:', err);
      updateSyncUI('disconnected');
    }
  }

  function broadcastCalculation(item) {
    if (mqttClient && mqttClient.connected && currentSyncPin) {
      const topic = `f2kalkulator/sync/room_${currentSyncPin}`;
      mqttClient.publish(topic, JSON.stringify({
        type: 'NEW_CALCULATION',
        senderId: myClientId,
        item: item
      }));
    }
  }

  function broadcastClearHistory() {
    if (mqttClient && mqttClient.connected && currentSyncPin) {
      const topic = `f2kalkulator/sync/room_${currentSyncPin}`;
      mqttClient.publish(topic, JSON.stringify({
        type: 'CLEAR_HISTORY',
        senderId: myClientId
      }));
    }
  }

  function disconnectSync() {
    if (mqttClient) {
      try {
        mqttClient.end(true);
      } catch (e) {}
      mqttClient = null;
    }
    currentSyncPin = null;
    localStorage.removeItem('f2calc_sync_pin');
    updateSyncUI('disconnected');
    if (syncPinInput) syncPinInput.value = '';
  }

  function notifyHistoryUpdate() {
    if (historyToggleBtn) {
      historyToggleBtn.classList.add('pressed');
      setTimeout(() => historyToggleBtn.classList.remove('pressed'), 300);
    }
  }

  function toggleSyncModal(show) {
    if (!syncModal) return;
    if (show === undefined) {
      syncModal.classList.toggle('open');
    } else if (show) {
      syncModal.classList.add('open');
    } else {
      syncModal.classList.remove('open');
    }
    syncModal.setAttribute('aria-hidden', !syncModal.classList.contains('open'));

    if (syncModal.classList.contains('open')) {
      if (currentSyncPin && syncPinInput) {
        syncPinInput.value = currentSyncPin;
      }
      if (syncPinInput) syncPinInput.focus();
    }
  }

  if (syncToggleBtn) {
    syncToggleBtn.addEventListener('click', () => toggleSyncModal(true));
  }
  if (closeSyncModalBtn) {
    closeSyncModalBtn.addEventListener('click', () => toggleSyncModal(false));
  }
  if (connectSyncBtn) {
    connectSyncBtn.addEventListener('click', () => {
      const pin = syncPinInput ? syncPinInput.value.trim() : '';
      if (!/^\d{4}$/.test(pin)) {
        if (syncStatusMsg) {
          syncStatusMsg.className = 'sync-status-msg error';
          syncStatusMsg.textContent = 'PIN harus berupa 4 digit angka (contoh: 1234)!';
        }
        if (syncPinInput) syncPinInput.focus();
        return;
      }

      initSync(pin);
      setTimeout(() => toggleSyncModal(false), 900);
    });
  }
  if (disconnectSyncBtn) {
    disconnectSyncBtn.addEventListener('click', () => {
      disconnectSync();
      setTimeout(() => toggleSyncModal(false), 600);
    });
  }

  // Hubungkan otomatis saat pertama kali buka jika PIN tersimpan
  if (currentSyncPin && /^\d{4}$/.test(currentSyncPin)) {
    initSync(currentSyncPin);
  } else {
    updateSyncUI('disconnected');
  }

  // =========================================================================
  // EVENT LISTENER KLIK PADA TOMBOL
  // =========================================================================
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      // Tombol aksi header & modal diabaikan dari kalkulasi angka
      if (
        btn.id === 'themeToggleBtn' ||
        btn.id === 'historyToggleBtn' ||
        btn.id === 'syncToggleBtn' ||
        btn.classList.contains('sync-submit-btn') ||
        btn.classList.contains('sync-disconnect-btn')
      ) return;

      const num = btn.dataset.number;
      const op = btn.dataset.operator;
      const action = btn.dataset.action;

      if (num !== undefined) {
        handleNumber(num);
      } else if (op !== undefined) {
        handleOperator(op);
      } else if (action !== undefined) {
        switch (action) {
          case 'all-clear':
            handleAllClear();
            break;
          case 'delete':
            handleDelete();
            break;
          case 'percent':
            handlePercent();
            break;
          case 'negate':
            handleNegate();
            break;
          case 'decimal':
            handleDecimal();
            break;
          case 'calculate':
            calculate(true);
            break;
        }
      }
    });
  });

  // =========================================================================
  // DUKUNGAN KEYBOARD FISIK
  // =========================================================================
  function triggerButtonEffect(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 150);
    }
  }

  window.addEventListener('keydown', (e) => {
    // Jika modal sinkronisasi sedang terbuka, prioritaskan input PIN
    if (syncModal && syncModal.classList.contains('open')) {
      if (e.key === 'Escape') {
        toggleSyncModal(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (connectSyncBtn) connectSyncBtn.click();
      }
      return;
    }

    const key = e.key;

    // Angka 0 - 9
    if (key >= '0' && key <= '9') {
      handleNumber(key);
      triggerButtonEffect(`button[data-number="${key}"]`);
    }
    // Desimal (titik atau koma)
    else if (key === '.' || key === ',') {
      handleDecimal();
      triggerButtonEffect('button[data-action="decimal"]');
    }
    // Operator
    else if (key === '+') {
      handleOperator('+');
      triggerButtonEffect('button[data-operator="+"]');
    } else if (key === '-') {
      handleOperator('-');
      triggerButtonEffect('button[data-operator="-"]');
    } else if (key === '*' || key.toLowerCase() === 'x') {
      handleOperator('×');
      triggerButtonEffect('button[data-operator="×"]');
    } else if (key === '/') {
      e.preventDefault(); // Mencegah shortcut search browser
      handleOperator('÷');
      triggerButtonEffect('button[data-operator="÷"]');
    }
    // Hasil / Enter
    else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculate(true);
      triggerButtonEffect('button[data-action="calculate"]');
    }
    // Backspace
    else if (key === 'Backspace') {
      handleDelete();
      triggerButtonEffect('button[data-action="delete"]');
    }
    // Escape atau huruf C / c untuk All Clear / Tutup Riwayat
    else if (key === 'Escape') {
      if (historyPanel && historyPanel.classList.contains('open')) {
        toggleHistory(false);
      } else {
        handleAllClear();
        triggerButtonEffect('button[data-action="all-clear"]');
      }
    } else if (key.toLowerCase() === 'c') {
      handleAllClear();
      triggerButtonEffect('button[data-action="all-clear"]');
    }
    // Persen
    else if (key === '%') {
      handlePercent();
      triggerButtonEffect('button[data-action="percent"]');
    }
  });

  // Render awal
  updateDisplay();
});
