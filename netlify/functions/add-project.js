const fs = require('fs').promises;
const path = require('path');

const PROJECTS_FILE = path.join(__dirname, '../../projects.json');
const SECRET_TOKEN = process.env.SECRET_TOKEN || 'your-secret-token-here';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authHeader = event.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (token !== SECRET_TOKEN) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Invalid access token' }) };
  }

  let newProject;
  try {
    newProject = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!newProject.title || !newProject.file) {
    return { statusCode: 400, body: 'Missing title or file URL' };
  }

  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(data);
    
    // Check for duplicate
    const exists = projects.find(p => p.title.toLowerCase() === newProject.title.toLowerCase());
    if (exists) {
      return { statusCode: 409, body: JSON.stringify({ error: 'Duplicate project title' }) };
    }

    newProject.tags = newProject.tags || [];
    newProject.createdAt = new Date().toISOString();
    projects.push(newProject);

    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');

    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, project: newProject })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update projects file' })
    };
  }
};