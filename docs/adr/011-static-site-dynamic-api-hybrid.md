# ADR-011: Static Site with Dynamic API Hybrid Architecture

## Status
Accepted

## Context
The unconference website required a balance between static site performance benefits and dynamic functionality for user authentication, live data feeds, and interactive features. We needed to choose between full static generation, full server-side rendering, or a hybrid approach.

## Decision
We implemented a hybrid architecture combining:
- Static HTML/CSS/JavaScript files for core content and UI
- Serverless API endpoints for dynamic functionality
- Client-side JavaScript for API integration and state management
- No build process or static site generators
- Direct file serving with dynamic enhancement

## Consequences

### Positive
- **Performance**: Static assets served directly from CDN with optimal caching
- **Simplicity**: No complex build pipelines or deployment processes
- **Flexibility**: Easy to add dynamic features without architectural changes
- **SEO Benefits**: Static HTML content is fully indexable
- **Development Speed**: Direct file editing without build/compile steps
- **Reliability**: Static content remains available even if APIs fail
- **Cost Efficiency**: Minimal server costs with serverless scaling

### Negative
- **Code Duplication**: Repeated HTML structure across pages
- **No Template System**: Manual maintenance of shared components
- **Client-Side Dependencies**: JavaScript required for dynamic features
- **SEO Limitations**: Dynamic content not server-side rendered
- **Bundle Optimization**: No automatic optimization or tree-shaking
- **Cache Invalidation**: Manual management of static asset versioning

### Trade-offs
- **Simplicity vs. Maintainability**: Chose simple architecture over DRY principles
- **Performance vs. Dynamic Content**: Static speed with client-side enhancement
- **Development Speed vs. Optimization**: Fast development over automated optimization
- **Flexibility vs. Structure**: Ad-hoc organization over rigid framework constraints

## Architecture Components

### Static Layer
- HTML files with embedded CSS and JavaScript
- Shared CSS files for common styling
- Client-side JavaScript libraries (Three.js, auth utilities)
- Image and media assets

### Dynamic Layer
- Vercel serverless functions for API endpoints
- Real-time WebSocket connections to third-party services
- Client-side state management with localStorage
- Dynamic content rendering with vanilla JavaScript

### Integration Strategy
- Progressive enhancement approach
- Graceful degradation when APIs unavailable
- Client-side routing for single-page interactions
- AJAX/fetch for dynamic data loading

## File Organization
```
/
├── *.html (individual pages)
├── *.css (shared stylesheets)
├── *.js (shared utilities)
├── /api/ (serverless functions)
├── /docs/ (documentation and ADRs)
└── configuration files (package.json, vercel.json)
```

## Development Workflow
1. Edit HTML/CSS/JavaScript files directly
2. Test locally with Vercel CLI (`vercel dev`)
3. Commit changes to git repository
4. Automatic deployment via Vercel git integration

## Performance Characteristics
- **Initial Load**: Fast static asset delivery
- **Subsequent Navigation**: Full page loads (no SPA routing)
- **Dynamic Content**: Client-side API calls with loading states
- **Caching**: Aggressive caching for static assets

## SEO Strategy
- Static HTML content fully crawlable
- Meta tags and structured data in static files
- Dynamic content enhancement after page load
- Proper heading hierarchy and semantic markup

## Accessibility Approach
- Progressive enhancement ensures core functionality without JavaScript
- Static content accessible by default
- Enhanced features gracefully degrade
- Proper semantic HTML structure

## Future Constraints
Architectural changes must:
1. Maintain static content accessibility and SEO benefits
2. Preserve fast initial load times
3. Ensure graceful degradation of dynamic features
4. Consider impact on development simplicity
5. Evaluate need for build process introduction carefully

## Migration Considerations
If moving to framework-based architecture:
- Static content can be easily templated
- API layer remains unchanged
- Client-side logic can be refactored to framework patterns
- CSS can be modularized and optimized

## Monitoring Requirements
- Static asset load times
- API endpoint performance
- Client-side error tracking
- User engagement with dynamic features
- Mobile performance metrics

## Quality Gates
New features must:
1. Work with JavaScript disabled (core functionality)
2. Enhance experience when JavaScript available
3. Maintain fast initial load times
4. Consider SEO impact of dynamic content
5. Test across various network conditions
6. Ensure mobile compatibility