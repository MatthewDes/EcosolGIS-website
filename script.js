// Global variables to store projects data and current filters
let allProjects = [];
let filteredProjects = [];
let activeTagFilters = new Set();

// DOM elements
const searchInput = document.getElementById('searchInput');
const tagFiltersContainer = document.getElementById('tagFilters');
const projectsContainer = document.getElementById('projectsContainer');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize archive functionality if we're on the archive page
    if (document.getElementById('projectsContainer')) {
        initializeArchive();
    }
});

/**
 * Initialize the archive page functionality
 */
async function initializeArchive() {
    try {
        showLoadingState();
        await loadProjects();
        setupEventListeners();
        renderTagFilters();
        renderProjects();
        hideLoadingState();
    } catch (error) {
        console.error('Error initializing archive:', error);
        showErrorState();
    }
}

/**
 * Load projects from the JSON file
 * Supports:
 *  - [ { ... }, { ... } ]                       (legacy: top-level array)
 *  - { "projects": [ { ... }, { ... } ] }       (Decap CMS-friendly)
 */
async function loadProjects() {
    try {
        const response = await fetch('projects.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Accept either a top-level array OR an object with a "projects" array
        let projectsArray = null;
        if (Array.isArray(data)) {
            projectsArray = data; // legacy format
        } else if (data && Array.isArray(data.projects)) {
            projectsArray = data.projects; // wrapped format
        }

        if (!Array.isArray(projectsArray)) {
            throw new Error('Invalid data format: expected an array of projects or an object with a "projects" array');
        }

        allProjects = projectsArray;
        filteredProjects = [...allProjects];

        console.log(`Successfully loaded ${allProjects.length} projects`);
    } catch (error) {
        console.error('Error loading projects:', error);
        throw error; // let the caller show the error state
    }
}


/**
 * Setup event listeners for search and filtering
 */
function setupEventListeners() {
    // Search input event listener with debouncing
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterProjects();
        }, 300);
    });

    // Clear search on escape key
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            filterProjects();
        }
    });
}

/**
 * Extract all unique tags from projects and render tag filters
 */
function renderTagFilters() {
    const allTags = new Set();
    
    // Extract all unique tags
    allProjects.forEach(project => {
        if (project.tags && Array.isArray(project.tags)) {
            project.tags.forEach(tag => {
                allTags.add(tag.toLowerCase().trim());
            });
        }
    });
    
    // Sort tags alphabetically
    const sortedTags = Array.from(allTags).sort();
    
    // Clear existing tag filters
    tagFiltersContainer.innerHTML = '';
    
    // Create tag filter elements
    sortedTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-filter';
        tagElement.textContent = tag;
        tagElement.dataset.tag = tag;
        
        // Add click event listener
        tagElement.addEventListener('click', function() {
            toggleTagFilter(tag, tagElement);
        });
        
        tagFiltersContainer.appendChild(tagElement);
    });
    
    console.log(`Rendered ${sortedTags.length} tag filters`);
}

/**
 * Toggle tag filter on/off
 */
function toggleTagFilter(tag, element) {
    if (activeTagFilters.has(tag)) {
        // Remove tag filter
        activeTagFilters.delete(tag);
        element.classList.remove('active');
    } else {
        // Add tag filter
        activeTagFilters.add(tag);
        element.classList.add('active');
    }
    
    filterProjects();
}

/**
 * Filter projects based on search term and active tag filters
 */
function filterProjects() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    filteredProjects = allProjects.filter(project => {
        // Check search term match (title or tags)
        const titleMatch = project.title.toLowerCase().includes(searchTerm);
        const tagMatch = project.tags && project.tags.some(tag => 
            tag.toLowerCase().includes(searchTerm)
        );
        const searchMatch = searchTerm === '' || titleMatch || tagMatch;
        
        // Check tag filter match
        const tagFilterMatch = activeTagFilters.size === 0 || 
            (project.tags && project.tags.some(tag => 
                activeTagFilters.has(tag.toLowerCase().trim())
            ));
        
        return searchMatch && tagFilterMatch;
    });
    
    renderProjects();
}

/**
 * Render the filtered projects
 */
function renderProjects() {
    // Clear existing projects
    projectsContainer.innerHTML = '';
    
    if (filteredProjects.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    // Create project cards
    filteredProjects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsContainer.appendChild(projectCard);
    });
    
    console.log(`Rendered ${filteredProjects.length} projects`);
}

/**
 * Create a project card element
 */
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    // Validate project data
    const title = project.title || 'Untitled Project';
    const tags = Array.isArray(project.tags) ? project.tags : [];
    const file = project.file || '#';
    
    card.innerHTML = `
        <h3 class="project-title">${escapeHtml(title)}</h3>
        <div class="project-tags">
            ${tags.map(tag => `<span class="project-tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <a href="${escapeHtml(file)}" target="_blank" class="view-pdf-btn">View PDF</a>
    `;
    
    return card;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Show loading state
 */
function showLoadingState() {
    loadingState.style.display = 'block';
    projectsContainer.style.display = 'none';
    hideEmptyState();
    hideErrorState();
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    loadingState.style.display = 'none';
    projectsContainer.style.display = 'grid';
}

/**
 * Show empty state
 */
function showEmptyState() {
    emptyState.style.display = 'block';
}

/**
 * Hide empty state
 */
function hideEmptyState() {
    emptyState.style.display = 'none';
}

/**
 * Show error state
 */
function showErrorState() {
    errorState.style.display = 'block';
    loadingState.style.display = 'none';
    projectsContainer.style.display = 'none';
    hideEmptyState();
}

/**
 * Hide error state
 */
function hideErrorState() {
    errorState.style.display = 'none';
}

// Utility functions for debugging (can be removed in production)
window.debugArchive = {
    getAllProjects: () => allProjects,
    getFilteredProjects: () => filteredProjects,
    getActiveTagFilters: () => Array.from(activeTagFilters),
    clearFilters: () => {
        activeTagFilters.clear();
        searchInput.value = '';
        document.querySelectorAll('.tag-filter.active').forEach(el => {
            el.classList.remove('active');
        });
        filterProjects();
    }
};
