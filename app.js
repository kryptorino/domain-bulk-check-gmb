// DOM Elements
const apiLogin = document.getElementById('api-login');
const apiPassword = document.getElementById('api-password');
const domainsInput = document.getElementById('domains-input');
const startCheckBtn = document.getElementById('start-check');
const clearBtn = document.getElementById('clear-btn');
const progressSection = document.getElementById('progress-section');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const resultsSection = document.getElementById('results-section');
const resultsBody = document.getElementById('results-body');
const errorMessage = document.getElementById('error-message');
const exportCsvBtn = document.getElementById('export-csv');
const exportJsonBtn = document.getElementById('export-json');
const exportTxtGmbBtn = document.getElementById('export-txt-gmb');

// Stats elements
const statTotal = document.getElementById('stat-total');
const statFound = document.getElementById('stat-found');
const statNotFound = document.getElementById('stat-not-found');
const statErrors = document.getElementById('stat-errors');

// Global variables
let currentResults = [];
// Use relative path for Vercel deployment, falls back to localhost for development
const API_ENDPOINT = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

// Cookie Helper Functions
function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

// Load saved credentials from cookies and localStorage
window.addEventListener('DOMContentLoaded', () => {
    // Try cookies first (persistent), then localStorage
    const savedLogin = getCookie('dataforseo_login') || localStorage.getItem('dataforseo_login');
    const savedPassword = getCookie('dataforseo_password') || localStorage.getItem('dataforseo_password');

    if (savedLogin) apiLogin.value = savedLogin;
    if (savedPassword) apiPassword.value = savedPassword;
});

// Save credentials to both cookies and localStorage
function saveCredentials() {
    const login = apiLogin.value;
    const password = apiPassword.value;

    // Save to localStorage (session)
    localStorage.setItem('dataforseo_login', login);
    localStorage.setItem('dataforseo_password', password);

    // Save to cookies (persistent for 1 year)
    setCookie('dataforseo_login', login, 365);
    setCookie('dataforseo_password', password, 365);
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
    setTimeout(() => {
        errorMessage.classList.remove('active');
    }, 5000);
}

// Clear error message
function clearError() {
    errorMessage.classList.remove('active');
}

// Validate inputs
function validateInputs() {
    if (!apiLogin.value.trim() || !apiPassword.value.trim()) {
        showError('⚠️ Bitte gib deine DataForSEO API Credentials ein.');
        return false;
    }

    const domains = domainsInput.value.trim().split('\n').filter(d => d.trim());
    if (domains.length === 0) {
        showError('⚠️ Bitte füge mindestens eine Domain ein.');
        return false;
    }

    return true;
}

// Parse domains from textarea
function parseDomains() {
    return domainsInput.value
        .trim()
        .split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 0);
}

// Update progress bar
function updateProgress(current, total) {
    const percentage = (current / total) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${current} von ${total} Domains überprüft`;
}

// Update statistics
function updateStats(results) {
    const total = results.length;
    const found = results.filter(r => r.status === 'found').length;
    const notFound = results.filter(r => r.status === 'not-found').length;
    const errors = results.filter(r => r.status === 'error').length;

    statTotal.textContent = total;
    statFound.textContent = found;
    statNotFound.textContent = notFound;
    statErrors.textContent = errors;
}

// Render results table
function renderResults(results) {
    resultsBody.innerHTML = '';

    results.forEach(result => {
        const row = document.createElement('tr');

        let statusBadge = '';
        let gmbName = '-';
        let address = '-';
        let reviews = '-';
        let details = '-';

        if (result.status === 'found') {
            statusBadge = '<span class="status-badge found">✓ Gefunden</span>';
            gmbName = result.gmbName || '-';
            address = result.address || '-';
            reviews = result.reviewsCount ?
                `⭐ ${result.rating}/5 (${result.reviewsCount} Bewertungen)` :
                '-';
            details = result.phone ? `📞 ${result.phone}` : '-';
        } else if (result.status === 'not-found') {
            statusBadge = '<span class="status-badge not-found">✗ Nicht gefunden</span>';
        } else if (result.status === 'error') {
            statusBadge = '<span class="status-badge error">⚠ Fehler</span>';
            details = result.message || 'Unbekannter Fehler';
        }

        row.innerHTML = `
            <td><strong>${result.domain}</strong></td>
            <td>${statusBadge}</td>
            <td>${gmbName}</td>
            <td>${address}</td>
            <td>${reviews}</td>
            <td>${details}</td>
        `;

        resultsBody.appendChild(row);
    });
}

// Start domain check
async function startCheck() {
    if (!validateInputs()) return;

    clearError();
    saveCredentials();

    const domains = parseDomains();

    // Show progress section
    progressSection.classList.add('active');
    resultsSection.classList.remove('active');
    startCheckBtn.disabled = true;

    // Reset progress
    updateProgress(0, domains.length);

    try {
        const response = await fetch(`${API_ENDPOINT}/check-domains`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                domains: domains,
                credentials: {
                    login: apiLogin.value.trim(),
                    password: apiPassword.value.trim()
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }

        const data = await response.json();

        // Update progress to 100%
        updateProgress(domains.length, domains.length);

        // Store results
        currentResults = data.results;

        // Update stats and render results
        updateStats(currentResults);
        renderResults(currentResults);

        // Show results section
        resultsSection.classList.add('active');

    } catch (error) {
        console.error('Error checking domains:', error);
        showError(`❌ Fehler beim Überprüfen der Domains: ${error.message}`);
    } finally {
        startCheckBtn.disabled = false;
    }
}

// Clear input
function clearInput() {
    domainsInput.value = '';
    resultsSection.classList.remove('active');
    progressSection.classList.remove('active');
    currentResults = [];
}

// Export results as CSV
function exportAsCSV() {
    if (currentResults.length === 0) {
        showError('⚠️ Keine Ergebnisse zum Exportieren vorhanden.');
        return;
    }

    const headers = ['Domain', 'Status', 'GMB Name', 'Adresse', 'Rating', 'Bewertungen', 'Telefon', 'Website', 'Kategorie'];
    const rows = currentResults.map(r => [
        r.domain,
        r.status,
        r.gmbName || '',
        r.address || '',
        r.rating || '',
        r.reviewsCount || '',
        r.phone || '',
        r.website || '',
        r.category || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, 'domain-check-results.csv', 'text/csv');
}

// Export results as JSON
function exportAsJSON() {
    if (currentResults.length === 0) {
        showError('⚠️ Keine Ergebnisse zum Exportieren vorhanden.');
        return;
    }

    const jsonContent = JSON.stringify(currentResults, null, 2);
    downloadFile(jsonContent, 'domain-check-results.json', 'application/json');
}

// Export domains with GMB as TXT (plain text, one domain per line)
function exportDomainsWithGMB() {
    if (currentResults.length === 0) {
        showError('⚠️ Keine Ergebnisse zum Exportieren vorhanden.');
        return;
    }

    // Filter only domains with found GMB entries
    const domainsWithGMB = currentResults
        .filter(r => r.status === 'found')
        .map(r => r.domain);

    if (domainsWithGMB.length === 0) {
        showError('⚠️ Keine Domains mit GMB-Einträgen gefunden.');
        return;
    }

    // Create plain text with one domain per line
    const txtContent = domainsWithGMB.join('\n');
    downloadFile(txtContent, 'domains-mit-gmb.txt', 'text/plain');
}

// Download file helper
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Event listeners
startCheckBtn.addEventListener('click', startCheck);
clearBtn.addEventListener('click', clearInput);
exportCsvBtn.addEventListener('click', exportAsCSV);
exportJsonBtn.addEventListener('click', exportAsJSON);
exportTxtGmbBtn.addEventListener('click', exportDomainsWithGMB);

// Allow Enter key in credentials fields to start check
apiLogin.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startCheck();
});

apiPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startCheck();
});
