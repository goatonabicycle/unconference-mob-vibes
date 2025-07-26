#!/usr/bin/env node

/**
 * ADR Compliance Checker
 * 
 * This script checks for potential violations of architectural decisions
 * documented in the ADRs. Run this before making significant changes.
 */

const fs = require('fs');
const path = require('path');

class ADRChecker {
  constructor() {
    this.violations = [];
    this.warnings = [];
  }

  checkADRCompliance() {
    console.log('🔍 Checking ADR compliance...\n');

    this.checkSynthwaveAesthetic();
    this.checkMobileFirst();
    this.checkPureCSS();
    this.checkDuckTheme();
    this.checkNavigationConsistency();
    this.checkAuthenticationPatterns();

    this.reportResults();
  }

  checkSynthwaveAesthetic() {
    console.log('📊 Checking ADR-001: Synthwave Aesthetic...');
    
    // Check for consistent color usage
    const cssFiles = this.findFiles(['synthwave-bg.css', 'footer.css', 'responsive.css']);
    
    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for core synthwave colors
      if (!content.includes('#ff006e') && !content.includes('#8b00ff')) {
        this.violations.push(`${file}: Missing core synthwave colors (#ff006e, #8b00ff)`);
      }
      
      // Check for glow effects
      if (!content.includes('box-shadow') && !content.includes('text-shadow')) {
        this.warnings.push(`${file}: Consider adding glow effects for synthwave aesthetic`);
      }
    }
  }

  checkMobileFirst() {
    console.log('📱 Checking ADR-002: Mobile-First Design...');
    
    const htmlFiles = this.findFiles(['*.html']);
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for viewport meta tag
      if (!content.includes('name="viewport"')) {
        this.violations.push(`${file}: Missing viewport meta tag for mobile responsiveness`);
      }
      
      // Check for responsive CSS
      if (!content.includes('responsive.css')) {
        this.violations.push(`${file}: Missing responsive.css include`);
      }
    }
  }

  checkPureCSS() {
    console.log('🎨 Checking ADR-003: Pure CSS Implementation...');
    
    const htmlFiles = this.findFiles(['*.html']);
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for CSS framework usage
      if (content.includes('bootstrap') || content.includes('tailwind')) {
        this.violations.push(`${file}: Contains CSS framework usage (violates pure CSS decision)`);
      }
    }
  }

  checkDuckTheme() {
    console.log('🦆 Checking ADR-009: Duck Theme Consistency...');
    
    const htmlFiles = this.findFiles(['*.html']);
    let duckThemeFiles = 0;
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('🦆') || content.includes('duck') || content.includes('Duck')) {
        duckThemeFiles++;
      }
    }
    
    if (duckThemeFiles < 3) {
      this.warnings.push('Duck theme may not be consistently applied across the site');
    }
  }

  checkNavigationConsistency() {
    console.log('🧭 Checking ADR-012: Navigation Consistency...');
    
    const htmlFiles = this.findFiles(['*.html']);
    let navigationStructures = new Set();
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Extract navigation structure
      const navMatch = content.match(/<nav[^>]*>[\s\S]*?<\/nav>/);
      if (navMatch) {
        const navLinks = (navMatch[0].match(/href="[^"]*"/g) || []).length;
        navigationStructures.add(navLinks);
      }
      
      // Check for mobile menu toggle
      if (!content.includes('toggleMobileMenu')) {
        this.warnings.push(`${file}: Missing mobile menu toggle function`);
      }
    }
    
    if (navigationStructures.size > 2) {
      this.violations.push('Navigation structures are inconsistent across pages');
    }
  }

  checkAuthenticationPatterns() {
    console.log('🔐 Checking ADR-007: Authentication Patterns...');
    
    // Check for auth.js inclusion in pages that might need it
    const htmlFiles = this.findFiles(['*.html']);
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('localStorage') && !content.includes('auth.js')) {
        this.warnings.push(`${file}: Uses localStorage but doesn't include auth.js`);
      }
    }
  }

  findFiles(patterns) {
    const files = [];
    const rootDir = path.join(__dirname, '..', '..');
    
    for (const pattern of patterns) {
      const filePath = path.join(rootDir, pattern);
      if (fs.existsSync(filePath)) {
        files.push(filePath);
      }
    }
    
    return files;
  }

  reportResults() {
    console.log('\n📋 ADR Compliance Report\n');
    
    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log('✅ No ADR violations or warnings found!');
      return;
    }
    
    if (this.violations.length > 0) {
      console.log('❌ VIOLATIONS (These must be addressed):');
      this.violations.forEach(violation => {
        console.log(`   • ${violation}`);
      });
      console.log('');
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS (Consider addressing):');
      this.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
      console.log('');
    }
    
    console.log(`Summary: ${this.violations.length} violations, ${this.warnings.length} warnings`);
    
    if (this.violations.length > 0) {
      console.log('\n💡 Review the relevant ADRs in docs/adr/ for guidance on resolving violations.');
      process.exit(1);
    }
  }
}

// Run the checker if this script is executed directly
if (require.main === module) {
  const checker = new ADRChecker();
  checker.checkADRCompliance();
}

module.exports = ADRChecker;