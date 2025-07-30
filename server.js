const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = process.env.SECRET_TOKEN || 'your-secret-token-here';
const PROJECTS_FILE = path.join(__dirname, 'projects.json');

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

/**
 * Authentication middleware
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Access token is required',
            message: 'Please provide a valid authorization token in the header' 
        });
    }
    
    if (token !== SECRET_TOKEN) {
        return res.status(403).json({ 
            error: 'Invalid access token',
            message: 'The provided token is not valid' 
        });
    }
    
    next();
}

/**
 * Validation middleware for project data
 */
function validateProject(req, res, next) {
    const { title, file, tags } = req.body;
    
    // Validate required fields
    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
            error: 'Invalid title',
            message: 'Project title is required and must be a non-empty string'
        });
    }
    
    if (!file || typeof file !== 'string' || !file.trim()) {
        return res.status(400).json({
            error: 'Invalid file',
            message: 'File URL is required and must be a non-empty string'
        });
    }
    
    // Validate file URL format
    try {
        new URL(file);
    } catch (error) {
        return res.status(400).json({
            error: 'Invalid file URL',
            message: 'File must be a valid URL'
        });
    }
    
    // Validate tags (optional)
    if (tags !== undefined && !Array.isArray(tags)) {
        return res.status(400).json({
            error: 'Invalid tags',
            message: 'Tags must be an array of strings'
        });
    }
    
    // Sanitize and normalize data
    req.body = {
        title: title.trim(),
        file: file.trim(),
        tags: Array.isArray(tags) ? tags.filter(tag => 
            typeof tag === 'string' && tag.trim().length > 0
        ).map(tag => tag.trim()) : []
    };
    
    next();
}

/**
 * Read projects from JSON file
 */
async function readProjects() {
    try {
        const data = await fs.readFile(PROJECTS_FILE, 'utf8');
        const projects = JSON.parse(data);
        
        if (!Array.isArray(projects)) {
            throw new Error('Projects file does not contain a valid array');
        }
        
        return projects;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return empty array
            console.log('Projects file does not exist, starting with empty array');
            return [];
        }
        
        console.error('Error reading projects file:', error);
        throw new Error('Failed to read projects file');
    }
}

/**
 * Write projects to JSON file
 */
async function writeProjects(projects) {
    try {
        // Create backup of existing file
        try {
            const backupFile = `${PROJECTS_FILE}.backup.${Date.now()}`;
            await fs.copyFile(PROJECTS_FILE, backupFile);
            console.log(`Created backup: ${backupFile}`);
        } catch (backupError) {
            // Ignore backup errors if original file doesn't exist
            if (backupError.code !== 'ENOENT') {
                console.warn('Failed to create backup:', backupError.message);
            }
        }
        
        // Write updated projects
        const data = JSON.stringify(projects, null, 2);
        await fs.writeFile(PROJECTS_FILE, data, 'utf8');
        
        console.log(`Successfully wrote ${projects.length} projects to file`);
    } catch (error) {
        console.error('Error writing projects file:', error);
        throw new Error('Failed to write projects file');
    }
}

/**
 * GET /api/projects - Retrieve all projects
 */
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await readProjects();
        res.json({
            success: true,
            projects: projects,
            count: projects.length
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve projects'
        });
    }
});

/**
 * POST /api/projects - Add a new project
 */
app.post('/api/projects', authenticateToken, validateProject, async (req, res) => {
    try {
        const newProject = req.body;
        
        // Read existing projects
        const projects = await readProjects();
        
        // Check for duplicate titles
        const existingProject = projects.find(p => 
            p.title.toLowerCase() === newProject.title.toLowerCase()
        );
        
        if (existingProject) {
            return res.status(409).json({
                error: 'Duplicate project',
                message: 'A project with this title already exists'
            });
        }
        
        // Add timestamp
        newProject.createdAt = new Date().toISOString();
        
        // Add new project
        projects.push(newProject);
        
        // Write back to file
        await writeProjects(projects);
        
        console.log(`Added new project: "${newProject.title}"`);
        
        res.status(201).json({
            success: true,
            message: 'Project added successfully',
            project: newProject,
            totalProjects: projects.length
        });
        
    } catch (error) {
        console.error('Error adding project:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to add project'
        });
    }
});

/**
 * DELETE /api/projects/:title - Delete a project by title
 */
app.delete('/api/projects/:title', authenticateToken, async (req, res) => {
    try {
        const titleToDelete = decodeURIComponent(req.params.title);
        
        // Read existing projects
        const projects = await readProjects();
        
        // Find project to delete
        const projectIndex = projects.findIndex(p => 
            p.title.toLowerCase() === titleToDelete.toLowerCase()
        );
        
        if (projectIndex === -1) {
            return res.status(404).json({
                error: 'Project not found',
                message: 'No project found with the specified title'
            });
        }
        
        // Remove project
        const deletedProject = projects.splice(projectIndex, 1)[0];
        
        // Write back to file
        await writeProjects(projects);
        
        console.log(`Deleted project: "${deletedProject.title}"`);
        
        res.json({
            success: true,
            message: 'Project deleted successfully',
            deletedProject: deletedProject,
            totalProjects: projects.length
        });
        
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete project'
        });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * Error handling middleware
 */
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
    });
});

/**
 * 404 handler
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested endpoint does not exist'
    });
});

/**
 * Start server
 */
app.listen(PORT, () => {
    console.log(`\n🚀 EcosolGIS Admin Server is running!`);
    console.log(`📊 Port: ${PORT}`);
    console.log(`🔐 Token: ${SECRET_TOKEN === 'your-secret-token-here' ? '⚠️  Using default token - please set SECRET_TOKEN environment variable' : '✅ Custom token configured'}`);
    console.log(`📁 Projects file: ${PROJECTS_FILE}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`\nAPI Endpoints:`);
    console.log(`  GET    /api/projects     - List all projects`);
    console.log(`  POST   /api/projects     - Add new project (requires auth)`);
    console.log(`  DELETE /api/projects/:title - Delete project (requires auth)`);
    console.log(`\n📖 Admin interface: admin.html\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    process.exit(0);
});