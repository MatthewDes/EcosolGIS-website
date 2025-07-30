// Admin panel JavaScript for managing project uploads
const API_BASE_URL = 'http://localhost:3000'; // Change this for production

// DOM elements
const projectForm = document.getElementById('projectForm');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');

// Form inputs
const tokenInput = document.getElementById('token');
const titleInput = document.getElementById('title');
const tagsInput = document.getElementById('tags');
const fileInput = document.getElementById('file');

/**
 * Initialize the admin panel
 */
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    // Auto-focus on token field
    tokenInput.focus();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Form submission
    projectForm.addEventListener('submit', handleFormSubmit);
    
    // Real-time validation
    [tokenInput, titleInput, fileInput].forEach(input => {
        input.addEventListener('input', validateForm);
    });
    
    // Convert Dropbox share links to direct download links automatically
    fileInput.addEventListener('blur', processDropboxLink);
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        showMessage('Please fill in all required fields correctly.', 'error');
        return;
    }
    
    const formData = collectFormData();
    
    try {
        setLoading(true);
        hideMessage();
        
        await submitProject(formData);
        
        showMessage('Project added successfully!', 'success');
        resetForm();
        
    } catch (error) {
        console.error('Error submitting project:', error);
        showMessage(error.message || 'Failed to add project. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Collect form data
 */
function collectFormData() {
    const tags = tagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    
    return {
        title: titleInput.value.trim(),
        tags: tags,
        file: fileInput.value.trim(),
        token: tokenInput.value.trim()
    };
}

/**
 * Submit project to backend
 */
async function submitProject(projectData) {
    const { token, ...project } = projectData;
    
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(project)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    
    return result;
}

/**
 * Validate form inputs
 */
function validateForm() {
    const token = tokenInput.value.trim();
    const title = titleInput.value.trim();
    const file = fileInput.value.trim();
    
    // Check required fields
    if (!token) {
        tokenInput.focus();
        return false;
    }
    
    if (!title) {
        titleInput.focus();
        return false;
    }
    
    if (!file) {
        fileInput.focus();
        return false;
    }
    
    // Validate URL format
    try {
        new URL(file);
    } catch (e) {
        fileInput.focus();
        showMessage('Please enter a valid URL for the file link.', 'error');
        return false;
    }
    
    return true;
}

/**
 * Process Dropbox share links to convert them to direct download links
 */
function processDropboxLink() {
    let url = fileInput.value.trim();
    
    if (url && url.includes('dropbox.com')) {
        // Convert Dropbox share link to direct download
        if (url.includes('?dl=0')) {
            url = url.replace('?dl=0', '?dl=1');
        } else if (!url.includes('?dl=1')) {
            url += (url.includes('?') ? '&' : '?') + 'dl=1';
        }
        
        fileInput.value = url;
    }
}

/**
 * Show message to user
 */
function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide message
 */
function hideMessage() {
    messageDiv.className = 'message hidden';
}

/**
 * Set loading state
 */
function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Adding Project...' : 'Add Project';
    
    // Disable form inputs during loading
    [tokenInput, titleInput, tagsInput, fileInput].forEach(input => {
        input.disabled = isLoading;
    });
}

/**
 * Reset form to initial state
 */
function resetForm() {
    projectForm.reset();
    tokenInput.focus();
}

/**
 * Utility functions for debugging
 */
window.adminDebug = {
    getFormData: () => {
        if (validateForm()) {
            return collectFormData();
        }
        return null;
    },
    testValidation: () => {
        return validateForm();
    },
    clearForm: () => {
        resetForm();
    }
};