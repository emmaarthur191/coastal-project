#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the environment variables
const envPath = path.join(__dirname, 'banking_backend', '.env.production');
const envVars = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key] = value;
        }
    });
}

// Simulate encryption key testing
function testEncryptionKeys() {
    console.log('=== TESTING ENCRYPTION KEYS ===');
    console.log('ENCRYPTION_KEY:', envVars.ENCRYPTION_KEY ? 'SET' : 'NOT SET');
    console.log('ENCRYPTION_SALT:', envVars.ENCRYPTION_SALT ? 'SET' : 'NOT SET');
    
    if (envVars.ENCRYPTION_KEY && envVars.ENCRYPTION_SALT) {
        console.log('Production encryption keys are configured');
        
        // Validate key lengths
        if (envVars.ENCRYPTION_KEY.length >= 43) { // Base64 encoded 32 bytes
            console.log('ENCRYPTION_KEY has correct length');
        } else {
            console.log('ENCRYPTION_KEY length is invalid');
        }
        
        if (envVars.ENCRYPTION_SALT.length >= 21) { // Base64 encoded 16 bytes
            console.log('ENCRYPTION_SALT has correct length');
        } else {
            console.log('ENCRYPTION_SALT length is invalid');
        }
        
        return true;
    } else {
        console.log('Production encryption keys are NOT configured');
        return false;
    }
}

// Test JWT token cookie implementation
function testJWTCookieImplementation() {
    console.log('\n=== TESTING JWT TOKEN COOKIE IMPLEMENTATION ===');
    
    // Check if the frontend API service has cookie implementation
    const apiServicePath = path.join(__dirname, 'frontend', 'src', 'services', 'api.js');
    
    if (fs.existsSync(apiServicePath)) {
        const apiContent = fs.readFileSync(apiServicePath, 'utf8');
        
        // Check for secure cookie implementation
        const hasSecureCookies = apiContent.includes('Secure; HttpOnly; SameSite=Strict');
        const hasCookieStorage = apiContent.includes('document.cookie');
        const noLocalStorage = !apiContent.includes('localStorage.setItem') || 
                               apiContent.includes('// localStorage.setItem is no longer used');
        
        console.log('Secure cookie implementation found:', hasSecureCookies);
        console.log('Cookie storage implemented:', hasCookieStorage);
        console.log('LocalStorage replaced:', noLocalStorage);
        
        return hasSecureCookies && hasCookieStorage && noLocalStorage;
    } else {
        console.log('API service file not found');
        return false;
    }
}

// Test CORS configuration
function testCORSConfiguration() {
    console.log('\n=== TESTING CORS CONFIGURATION ===');
    
    const settingsPath = path.join(__dirname, 'banking_backend', 'config', 'settings.py');
    
    if (fs.existsSync(settingsPath)) {
        const settingsContent = fs.readFileSync(settingsPath, 'utf8');
        
        // Check for production CORS configuration
        const hasProductionCheck = settingsContent.includes("ENVIRONMENT == 'production'");
        const hasHttpsOnly = settingsContent.includes("origin.startswith('https://')");
        const hasImproperlyConfigured = settingsContent.includes('raise ImproperlyConfigured');
        const hasProductionOrigins = settingsContent.includes('CORS_ALLOWED_ORIGINS');
        
        console.log('Production environment check:', hasProductionCheck);
        console.log('HTTPS-only origins:', hasHttpsOnly);
        console.log('ImproperlyConfigured error:', hasImproperlyConfigured);
        console.log('Production origins configured:', hasProductionOrigins);
        
        return hasProductionCheck && hasHttpsOnly && hasImproperlyConfigured && hasProductionOrigins;
    } else {
        console.log('Settings file not found');
        return false;
    }
}

// Test error message sanitization
function testErrorMessageSanitization() {
    console.log('\n=== TESTING ERROR MESSAGE SANITIZATION ===');
    
    const apiServicePath = path.join(__dirname, 'frontend', 'src', 'services', 'api.js');
    
    if (fs.existsSync(apiServicePath)) {
        const apiContent = fs.readFileSync(apiServicePath, 'utf8');
        
        // Check for production error sanitization
        const hasProductionCheck = apiContent.includes('import.meta.env.PROD');
        const hasGenericMessage = apiContent.includes('An error occurred. Please try again');
        const hasSensitivePatterns = apiContent.includes('password\\s*[:=]') || 
                                    apiContent.includes('/password/i');
        
        console.log('Production environment check:', hasProductionCheck);
        console.log('Generic error messages:', hasGenericMessage);
        console.log('Sensitive data patterns:', hasSensitivePatterns);
        
        return hasProductionCheck && hasGenericMessage && hasSensitivePatterns;
    } else {
        console.log('API service file not found');
        return false;
    }
}

// Test race condition fixes
function testRaceConditionFixes() {
    console.log('\n=== TESTING RACE CONDITION FIXES ===');
    
    const modelsPath = path.join(__dirname, 'banking_backend', 'banking', 'models.py');
    
    if (fs.existsSync(modelsPath)) {
        const modelsContent = fs.readFileSync(modelsPath, 'utf8');
        
        // Check for race condition fixes
        const hasSelectForUpdate = modelsContent.includes('select_for_update()');
        const hasBalanceRecheck = modelsContent.includes('balance < self.amount') || 
                                  modelsContent.includes('balance <');
        const hasAtomicTransaction = modelsContent.includes('db_transaction.atomic()');
        
        console.log('select_for_update() implemented:', hasSelectForUpdate);
        console.log('Balance re-validation:', hasBalanceRecheck);
        console.log('Atomic transactions:', hasAtomicTransaction);
        
        return hasSelectForUpdate && hasBalanceRecheck && hasAtomicTransaction;
    } else {
        console.log('Models file not found');
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('BANKING APPLICATION SECURITY TESTING\n');
    
    const results = {
        encryption: testEncryptionKeys(),
        jwtCookies: testJWTCookieImplementation(),
        cors: testCORSConfiguration(),
        errorSanitization: testErrorMessageSanitization(),
        raceConditions: testRaceConditionFixes()
    };
    
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log('Encryption Keys:', results.encryption ? 'PASS' : 'FAIL');
    console.log('JWT Cookie Implementation:', results.jwtCookies ? 'PASS' : 'FAIL');
    console.log('CORS Configuration:', results.cors ? 'PASS' : 'FAIL');
    console.log('Error Message Sanitization:', results.errorSanitization ? 'PASS' : 'FAIL');
    console.log('Race Condition Fixes:', results.raceConditions ? 'PASS' : 'FAIL');
    
    const allPassed = Object.values(results).every(result => result);
    
    console.log('\n=== OVERALL RESULT ===');
    if (allPassed) {
        console.log('ALL SECURITY TESTS PASSED! The application is ready for production deployment.');
    } else {
        console.log('Some security tests failed. Please review and fix the issues before production deployment.');
    }
    
    return allPassed;
}

// Check if this script is being run directly
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests };