#!/usr/bin/env node

/**
 * PWA Validation Script
 * Checks if the application meets PWA criteria
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 PWA Validation Script\n');
console.log('=' .repeat(50));

let score = 0;
let maxScore = 0;
const checks = [];

// Check 1: Manifest exists and is valid
maxScore += 10;
try {
    const manifestPath = path.join(__dirname, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (manifest.name && manifest.short_name && manifest.start_url && 
        manifest.display && manifest.icons && manifest.icons.length >= 2) {
        checks.push('✅ Manifest file is valid and complete');
        score += 10;
    } else {
        checks.push('⚠️  Manifest file is incomplete');
        score += 5;
    }
} catch (e) {
    checks.push('❌ Manifest file is missing or invalid');
}

// Check 2: Service Worker exists
maxScore += 10;
try {
    const swPath = path.join(__dirname, 'sw.js');
    const swContent = fs.readFileSync(swPath, 'utf8');
    
    if (swContent.includes('install') && swContent.includes('fetch') && 
        swContent.includes('activate')) {
        checks.push('✅ Service Worker has all required event handlers');
        score += 10;
    } else {
        checks.push('⚠️  Service Worker is missing some event handlers');
        score += 5;
    }
} catch (e) {
    checks.push('❌ Service Worker file is missing');
}

// Check 3: Icons exist
maxScore += 10;
const requiredSizes = ['192x192', '512x512'];
let iconCount = 0;

requiredSizes.forEach(size => {
    const iconPath = path.join(__dirname, 'icons', `icon-${size}.png`);
    if (fs.existsSync(iconPath)) {
        iconCount++;
    }
});

if (iconCount === requiredSizes.length) {
    checks.push('✅ All required icons are present');
    score += 10;
} else if (iconCount > 0) {
    checks.push('⚠️  Some required icons are missing');
    score += 5;
} else {
    checks.push('❌ Required icons are missing');
}

// Check 4: HTML has PWA meta tags
maxScore += 10;
try {
    const htmlPath = path.join(__dirname, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    let metaCount = 0;
    if (html.includes('manifest.json')) metaCount++;
    if (html.includes('theme-color')) metaCount++;
    if (html.includes('apple-mobile-web-app-capable')) metaCount++;
    if (html.includes('viewport')) metaCount++;
    
    if (metaCount >= 4) {
        checks.push('✅ HTML has all PWA meta tags');
        score += 10;
    } else if (metaCount >= 2) {
        checks.push('⚠️  HTML is missing some PWA meta tags');
        score += 5;
    } else {
        checks.push('❌ HTML is missing PWA meta tags');
    }
} catch (e) {
    checks.push('❌ Could not read HTML file');
}

// Check 5: Responsive design
maxScore += 10;
try {
    const cssPath = path.join(__dirname, 'styles.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    
    if (css.includes('@media') && css.includes('max-width')) {
        checks.push('✅ CSS includes responsive media queries');
        score += 10;
    } else {
        checks.push('⚠️  CSS may not be fully responsive');
        score += 5;
    }
} catch (e) {
    checks.push('❌ Could not read CSS file');
}

// Check 6: HTTPS ready (checks for secure context requirements)
maxScore += 10;
try {
    const jsPath = path.join(__dirname, 'app.js');
    const js = fs.readFileSync(jsPath, 'utf8');
    
    if (js.includes('serviceWorker') && js.includes('navigator')) {
        checks.push('✅ JavaScript includes Service Worker registration');
        score += 10;
    } else {
        checks.push('⚠️  JavaScript may not register Service Worker');
        score += 5;
    }
} catch (e) {
    checks.push('❌ Could not read JavaScript file');
}

// Check 7: Offline capability indicators
maxScore += 10;
try {
    const swPath = path.join(__dirname, 'sw.js');
    const sw = fs.readFileSync(swPath, 'utf8');
    
    if (sw.includes('cache') && sw.includes('CACHE_NAME')) {
        checks.push('✅ Service Worker implements caching strategy');
        score += 10;
    } else {
        checks.push('⚠️  Service Worker may not cache properly');
        score += 5;
    }
} catch (e) {
    checks.push('❌ Could not verify caching strategy');
}

// Check 8: Mobile optimizations
maxScore += 10;
try {
    const htmlPath = path.join(__dirname, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    if (html.includes('apple-touch-icon') && 
        html.includes('viewport-fit=cover')) {
        checks.push('✅ Mobile-specific optimizations present');
        score += 10;
    } else if (html.includes('apple-touch-icon')) {
        checks.push('⚠️  Some mobile optimizations missing');
        score += 5;
    } else {
        checks.push('❌ Mobile optimizations missing');
    }
} catch (e) {
    checks.push('❌ Could not check mobile optimizations');
}

// Check 9: Touch interactions
maxScore += 10;
try {
    const jsPath = path.join(__dirname, 'app.js');
    const js = fs.readFileSync(jsPath, 'utf8');
    
    if (js.includes('touch') || js.includes('vibrate')) {
        checks.push('✅ Touch and haptic feedback implemented');
        score += 10;
    } else {
        checks.push('⚠️  Touch interactions may be limited');
        score += 5;
    }
} catch (e) {
    checks.push('❌ Could not check touch interactions');
}

// Check 10: Install prompt
maxScore += 10;
try {
    const jsPath = path.join(__dirname, 'app.js');
    const htmlPath = path.join(__dirname, 'index.html');
    const js = fs.readFileSync(jsPath, 'utf8');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    if ((js.includes('beforeinstallprompt') || html.includes('beforeinstallprompt')) &&
        html.includes('installPrompt')) {
        checks.push('✅ Install prompt implemented');
        score += 10;
    } else {
        checks.push('⚠️  Install prompt may not work properly');
        score += 5;
    }
} catch (e) {
    checks.push('❌ Could not check install prompt');
}

// Display results
console.log('\nValidation Results:');
console.log('=' .repeat(50));
checks.forEach(check => console.log(check));

console.log('\n' + '=' .repeat(50));
const percentage = Math.round((score / maxScore) * 100);
console.log(`\n📊 PWA Score: ${score}/${maxScore} (${percentage}%)\n`);

if (percentage >= 90) {
    console.log('🎉 Excellent! Your PWA meets all requirements!');
} else if (percentage >= 70) {
    console.log('✅ Good! Your PWA meets most requirements.');
} else if (percentage >= 50) {
    console.log('⚠️  Fair. Consider improving some areas.');
} else {
    console.log('❌ Needs work. Several PWA features are missing.');
}

console.log('\n📝 Next steps:');
console.log('   1. Test on actual devices (Android & iOS)');
console.log('   2. Run Lighthouse audit: npx lighthouse http://localhost:8080');
console.log('   3. Test offline functionality');
console.log('   4. Verify install flow on mobile');
console.log('   5. Check Service Worker registration in DevTools\n');

process.exit(percentage >= 70 ? 0 : 1);
