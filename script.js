// State Management
const defaultData = {
    theme: 'theme-soft', // Updated default name
    s1: [],
    s2: []
};

let appData = JSON.parse(localStorage.getItem('gradeMasterData')) || defaultData;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Ensure we handle old theme names if user had previous version
    if(!appData.theme.startsWith('theme-')) appData.theme = 'theme-soft';
    
    loadTheme(appData.theme);
    renderModules('s1');
    renderModules('s2');
    calculateAll();
});

// Theme Handling
const themeSelector = document.getElementById('theme-selector');
themeSelector.value = appData.theme;
themeSelector.addEventListener('change', (e) => {
    loadTheme(e.target.value);
    appData.theme = e.target.value;
    saveData();
});

function loadTheme(themeName) {
    document.body.className = themeName;
    // Update theme-color meta tag for mobile browsers chrome/safari header
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if(themeName === 'theme-midnight') metaThemeColor.setAttribute("content", "#0f172a");
    else if(themeName === 'theme-latte') metaThemeColor.setAttribute("content", "#e6ded5");
    else if(themeName === 'theme-forest') metaThemeColor.setAttribute("content", "#111c16");
    else metaThemeColor.setAttribute("content", "#f3f6f8");
}

// Tab Switching
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    const btns = document.querySelectorAll('.tab-btn');
    if(tabId === 's1') btns[0].classList.add('active');
    if(tabId === 's2') btns[1].classList.add('active');
    if(tabId === 'summary') {
        btns[2].classList.add('active');
        calculateSummary();
    }
}

// Data Manipulation
function addModule(semester) {
    const newModule = {
        id: Date.now(),
        name: 'New Module',
        coeff: 1,
        exam: '',
        td: '',
        tp: ''
    };
    appData[semester].push(newModule);
    saveData();
    renderModules(semester);
}

function deleteModule(semester, id) {
    appData[semester] = appData[semester].filter(m => m.id !== id);
    saveData();
    renderModules(semester);
    calculateAll();
}

function updateModule(semester, id, field, value) {
    const module = appData[semester].find(m => m.id === id);
    if (module) {
        module[field] = value;
        saveData();
        calculateRow(semester, id); 
        calculateTotals(semester);
    }
}

// Rendering
function renderModules(semester) {
    const container = document.getElementById(`${semester}-list`);
    container.innerHTML = '';
    const template = document.getElementById('module-template');

    appData[semester].forEach(mod => {
        const clone = template.content.cloneNode(true);
        
        const card = clone.querySelector('.module-card');
        const inputName = clone.querySelector('.input-name');
        const inputCoeff = clone.querySelector('.input-coeff');
        const inputExam = clone.querySelector('.input-exam');
        const inputTd = clone.querySelector('.input-td');
        const inputTp = clone.querySelector('.input-tp');
        const btnDelete = clone.querySelector('.btn-delete');
        const resultSpan = clone.querySelector('.module-result');

        card.dataset.id = mod.id;

        inputName.value = mod.name;
        inputCoeff.value = mod.coeff;
        inputExam.value = mod.exam;
        inputTd.value = mod.td;
        inputTp.value = mod.tp;

        inputName.oninput = (e) => updateModule(semester, mod.id, 'name', e.target.value);
        inputCoeff.oninput = (e) => updateModule(semester, mod.id, 'coeff', e.target.value);
        inputExam.oninput = (e) => updateModule(semester, mod.id, 'exam', e.target.value);
        inputTd.oninput = (e) => updateModule(semester, mod.id, 'td', e.target.value);
        inputTp.oninput = (e) => updateModule(semester, mod.id, 'tp', e.target.value);
        
        btnDelete.onclick = () => {
            // No alert needed for smoother UX, or use a soft confirm
            if(confirm('Remove this module?')) deleteModule(semester, mod.id);
        };

        // Initial calc
        const avg = calculateModuleAverage(mod.exam, mod.td, mod.tp);
        resultSpan.textContent = avg.toFixed(2);
        
        container.appendChild(clone);
    });
    
    calculateTotals(semester);
}

// Calculations (Same Logic as before)
function calculateModuleAverage(examStr, tdStr, tpStr) {
    const exam = parseFloat(examStr) || 0;
    const td = tdStr === '' ? null : parseFloat(tdStr);
    const tp = tpStr === '' ? null : parseFloat(tpStr);

    let cc = 0; 
    let hasCC = false;

    if (td !== null && tp !== null) {
        cc = (td + tp) / 2;
        hasCC = true;
    } else if (td !== null) {
        cc = td;
        hasCC = true;
    } else if (tp !== null) {
        cc = tp;
        hasCC = true;
    }

    if (hasCC) {
        return (cc * 0.4) + (exam * 0.6);
    } else {
        return exam; 
    }
}

function calculateRow(semester, id) {
    const module = appData[semester].find(m => m.id === id);
    if (!module) return;
    const avg = calculateModuleAverage(module.exam, module.td, module.tp);
    const card = document.querySelector(`#${semester}-list .module-card[data-id="${id}"]`);
    if(card) {
        card.querySelector('.module-result').textContent = avg.toFixed(2);
    }
}

function calculateTotals(semester) {
    let totalPoints = 0;
    let totalCoeff = 0;

    appData[semester].forEach(mod => {
        const coeff = parseFloat(mod.coeff) || 1;
        const avg = calculateModuleAverage(mod.exam, mod.td, mod.tp);
        
        totalPoints += (avg * coeff);
        totalCoeff += coeff;
    });

    const semesterAvg = totalCoeff === 0 ? 0 : (totalPoints / totalCoeff);
    document.getElementById(`${semester}-avg`).textContent = semesterAvg.toFixed(2);
}

function calculateAll() {
    calculateTotals('s1');
    calculateTotals('s2');
}

function calculateSummary() {
    calculateAll();
    const s1Avg = parseFloat(document.getElementById('s1-avg').textContent);
    const s2Avg = parseFloat(document.getElementById('s2-avg').textContent);
    
    document.getElementById('report-s1').textContent = s1Avg.toFixed(2);
    document.getElementById('report-s2').textContent = s2Avg.toFixed(2);
    
    const yearAvg = (s1Avg + s2Avg) / 2;
    document.getElementById('year-avg').textContent = yearAvg.toFixed(2);

    const verdict = document.getElementById('verdict');
    if(yearAvg >= 10) {
        verdict.textContent = "PASSED";
    } else {
        verdict.textContent = "ADJOURNED";
    }
}

function resetAllData() {
    if(confirm('Delete all data?')) {
        localStorage.removeItem('gradeMasterData');
        location.reload();
    }
}

function saveData() {
    localStorage.setItem('gradeMasterData', JSON.stringify(appData));
}
