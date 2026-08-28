const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
    count++;
    const code = match[1].trim();
    if (code.length < 100) continue;
    if (count !== 6) continue;
    
    const lines = code.split('\n');
    let bracketCount = 0;
    let minBracket = 0;
    let minLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Simple bracket counting (skip strings roughly)
        let inSingle = false, inDouble = false, inTemplate = false;
        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            const prev = j > 0 ? line[j-1] : '';
            if (ch === "'" && !inDouble && !inTemplate && prev !== '\\') inSingle = !inSingle;
            if (ch === '"' && !inSingle && !inTemplate && prev !== '\\') inDouble = !inDouble;
            if (ch === '`' && !inSingle && !inDouble) inTemplate = !inTemplate;
            if (!inSingle && !inDouble && !inTemplate) {
                if (ch === '[') bracketCount++;
                if (ch === ']') bracketCount--;
            }
        }
        if (bracketCount < minBracket) {
            minBracket = bracketCount;
            minLine = i + 1;
            console.log(`Bracket count went to ${bracketCount} at script line ${i + 1}: ${line.trim().substring(0, 120)}`);
        }
    }
    
    console.log(`\nFinal bracket balance: ${bracketCount}`);
    
    // Now check for initDeviceNotificationChannels to see if it has issues
    const funcStart = code.indexOf('async function initDeviceNotificationChannels');
    if (funcStart >= 0) {
        const beforeLines = code.substring(0, funcStart).split('\n').length;
        console.log(`\ninitDeviceNotificationChannels starts at script line ${beforeLines}`);
        
        // Find the function body
        let braces = 0;
        let started = false;
        let funcEnd = funcStart;
        for (let i = funcStart; i < code.length; i++) {
            if (code[i] === '{') { braces++; started = true; }
            if (code[i] === '}') braces--;
            if (started && braces === 0) { funcEnd = i; break; }
        }
        const funcCode = code.substring(funcStart, funcEnd + 1);
        const funcLines = funcCode.split('\n');
        console.log(`Function length: ${funcLines.length} lines`);
        
        // Check syntax of just this function
        try {
            new Function(funcCode);
            console.log('initDeviceNotificationChannels syntax: OK');
        } catch(e) {
            console.log('initDeviceNotificationChannels syntax ERROR:', e.message);
        }
    }
    
    // Check if showApp has issues
    const showAppStart = code.indexOf('function showApp()');
    if (showAppStart >= 0) {
        const beforeLines = code.substring(0, showAppStart).split('\n').length;
        console.log(`\nshowApp starts at script line ${beforeLines}`);
        let braces = 0;
        let started = false;
        let funcEnd = showAppStart;
        for (let i = showAppStart; i < code.length; i++) {
            if (code[i] === '{') { braces++; started = true; }
            if (code[i] === '}') braces--;
            if (started && braces === 0) { funcEnd = i; break; }
        }
        const funcCode = code.substring(showAppStart, funcEnd + 1);
        console.log('showApp code:');
        console.log(funcCode);
    }
}
