// This is index.js for rendering dev logs
import { loadXML } from './parser.js';

// Global state
let devLogs = [];
let currentFilter = 'all';
let currentPage = 1;
const LOGS_PER_PAGE = 5;

// Initialize the application
async function init() {
    // Reset pagination state
    currentPage = 1;
    
    try {
        // Load and parse XML data
        const result = await loadXML('logs.xml');
        
        if (!result.success) {
            showError(`Error loading dev logs: ${result.error}`);
            return;
        }
        
        devLogs = result.data;
        
        if (devLogs.length === 0) {
            showError('No dev logs found');
            return;
        }
        
        // Render the dev logs
        renderDevLogs();
        
        // Hide loading state
        document.getElementById('loading').style.display = 'none';
        document.getElementById('devlog-list').style.display = 'grid';
    } catch (error) {
        showError(`Unexpected error: ${error.message}`);
    }
}

// Render dev logs with pagination
function renderDevLogs() {
    const devlogList = document.getElementById('devlog-list');
    const paginationContainer = document.getElementById('pagination-container');
    
    // Clear previous content
    devlogList.innerHTML = '';
    paginationContainer.innerHTML = '';
    
    const filteredLogs = currentFilter === 'all' ? devLogs : devLogs.filter(log => log.type === currentFilter);
    const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
    
    // Paginate logs
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + LOGS_PER_PAGE);
    
    // Create pagination controls
    if (totalPages > 1) {
        paginationContainer.innerHTML = `
            <div class="pagination">
                <button ${currentPage === 1 ? 'disabled' : ''} id="prev-page">←</button>
                <span>Page ${currentPage} of ${totalPages}</span>
                <button ${currentPage === totalPages ? 'disabled' : ''} id="next-page">→</button>
            </div>
        `;
        
        document.getElementById('prev-page').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderDevLogs();
            }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderDevLogs();
            }
        });
    }
    
    // Render logs
    if (paginatedLogs.length === 0) {
        devlogList.innerHTML = '<p style="text-align: center; color: var(--text-light);">No logs found for this filter</p>';
        return;
    }
    
    paginatedLogs.forEach(log => {
        const card = createDevLogCard(log);
        devlogList.appendChild(card);
    });
}

// Create a dev log card
function createDevLogCard(log) {
    const card = document.createElement('div');
    card.className = 'devlog-card';
    card.innerHTML = `
        <div class="devlog-header">
            <div>
                <h3 class="devlog-title">${log.heading || log.title}</h3>
                <p class="devlog-date">${formatDate(log.pubDate.date)} ${log.pubDate.timezone ? `(${log.pubDate.timezone})` : ''}</p>
            </div>
            ${log.type ? `<span class="devlog-type">${log.type}</span>` : ''}
        </div>
        <p class="devlog-description">${log.description}</p>
        <div class="devlog-content" id="content-${log.id}">
            ${log.content}
        </div>
        <button class="devlog-toggle" data-id="${log.id}">Read More</button>
    `;
    
    // Add toggle functionality
    const toggleBtn = card.querySelector('.devlog-toggle');
    toggleBtn.addEventListener('click', () => toggleContent(log.id));
    
    return card;
}

// Toggle content visibility
function toggleContent(logId) {
    const content = document.getElementById(`content-${logId}`);
    const toggleBtn = document.querySelector(`[data-id="${logId}"]`);
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        toggleBtn.textContent = 'Read More';
    } else {
        content.classList.add('expanded');
        toggleBtn.textContent = 'Read Less';
    }
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);