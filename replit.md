# EcosolGIS - Static Project Archive Website

## Overview

EcosolGIS is a static website for a biodiversity planning consultancy that provides spatial solutions for conservation. The site features a home page with company information and a project archive page that displays searchable and filterable project documents (PDFs) with tagging functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

This is a client-side static website built with vanilla HTML, CSS, and JavaScript. The architecture follows a simple three-tier approach:

1. **Presentation Layer**: HTML pages with responsive CSS styling
2. **Logic Layer**: Client-side JavaScript for dynamic functionality
3. **Data Layer**: Static JSON file containing project metadata

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with gradients and responsive design
- **Data Storage**: Static JSON file (`projects.json`)
- **File Serving**: Static file hosting (PDFs stored in `/pdfs/` directory)

## Key Components

### 1. Pages Structure
- **Home Page** (`index.html`): Company introduction and contact information
- **Project Archive** (`archive.html`): Interactive project browser with search and filtering

### 2. Styling System
- **Responsive Design**: Mobile-first approach with flexible layouts
- **Color Scheme**: Green-themed palette reflecting environmental focus
- **Typography**: Clean, professional font stack
- **Interactive Elements**: Hover effects and smooth transitions

### 3. JavaScript Functionality
- **Project Loading**: Asynchronous JSON data fetching
- **Search System**: Real-time text-based project filtering
- **Tag Filtering**: Dynamic tag-based project categorization
- **State Management**: Loading, empty, and error states

### 4. Data Structure
Projects are stored in `projects.json` with the following schema:
```json
{
  "title": "string",
  "tags": ["array", "of", "strings"],
  "file": "path/to/pdf"
}
```

## Data Flow

1. **Page Load**: Archive page initializes and shows loading state
2. **Data Fetch**: JavaScript loads project data from `projects.json`
3. **UI Generation**: 
   - Tag filters are dynamically created from project tags
   - Project cards are rendered in the container
4. **User Interaction**:
   - Search input filters projects by title/tags
   - Tag filters can be toggled to refine results
   - Combined filters work together to show relevant projects

## External Dependencies

### Current Dependencies
- **None**: The project uses only vanilla web technologies

### File Dependencies
- **PDF Files**: Project documents stored in `/pdfs/` directory
- **Project Data**: `projects.json` contains metadata for all projects

### Potential Future Dependencies
- Font libraries (currently using system fonts)
- Icon libraries for enhanced UI
- Analytics tracking

## Deployment Strategy

### Current Approach
- **Static Hosting**: Designed for deployment on static hosting services
- **File Structure**: All assets in root directory for simple deployment
- **No Build Process**: Direct deployment of source files

### Recommended Hosting Options
- GitHub Pages
- Netlify
- Vercel
- Traditional web hosting with static file support

### Deployment Requirements
- Web server capable of serving static files
- Support for JSON file serving
- PDF file serving capability
- HTTPS recommended for professional appearance

### Future Considerations
- Content Management System integration for easier project updates
- Database backend for more complex project metadata
- User authentication for private project access
- Advanced search functionality with full-text PDF content indexing