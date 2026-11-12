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
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#231a15');
    } else {
      document.body.classList.remove(THEME_BROWN);
      document.body.classList.add(THEME_PURPLE);
      themeLabel.textContent = 'Coklat Dark';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#ece8f8');
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
      setExpression(`${previousValue} ${currentOperator} ${currentValue} =`);
      currentValue = formattedResult;
      previousValue = null;
      currentOperator = null;
      isResultState = true;
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
    currentValue = formatNumber(result);
    setExpression(`${num}%`);
    isResultState = true;
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
  // EVENT LISTENER KLIK PADA TOMBOL
  // =========================================================================
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      // Tombol toggle tema diabaikan dari kalkulasi
      if (btn.id === 'themeToggleBtn') return;

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
    // Escape atau huruf C / c untuk All Clear
    else if (key === 'Escape' || key.toLowerCase() === 'c') {
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
