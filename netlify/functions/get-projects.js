const fs = require('fs').promises;
const path = require('path');

const PROJECTS_FILE = path.join(__dirname, '../../projects.json');

exports.handler = async function(event, context) {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        projects: projects,
        count: projects.length
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to read projects file' })
    };
  }
};