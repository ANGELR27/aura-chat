const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Extract the main big script block
const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
    count++;
    const code = match[1].trim();
    if (code.length < 100) continue;
    
    console.log(`\n=== Script #${count} (${code.length} chars) ===`);
    
    // Try strict mode parse
    try {
        new Function('"use strict";\n' + code);
        console.log('✅ Strict mode syntax: OK');
    } catch(err) {
        console.error('❌ SYNTAX ERROR:', err.message);
        
        // Find the exact line
        const lines = code.split('\n');
        const errMatch = err.message.match(/(\d+):/);
        if (errMatch) {
            const lineNum = parseInt(errMatch[1]);
            console.log(`\nError near line ${lineNum}:`);
            for (let i = Math.max(0, lineNum - 5); i < Math.min(lines.length, lineNum + 5); i++) {
                const marker = (i + 1 === lineNum) ? '>>> ' : '    ';
                console.log(`${marker}${i + 1}: ${lines[i]}`);
            }
        }
    }
    
    // Also check for common issues
    // Count braces
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip strings (rough)
        const cleaned = line.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '').replace(/`[^`]*`/g, '');
        for (const ch of cleaned) {
            if (ch === '{') braceCount++;
            if (ch === '}') braceCount--;
            if (ch === '(') parenCount++;
            if (ch === ')') parenCount--;
            if (ch === '[') bracketCount++;
            if (ch === ']') bracketCount--;
        }
        if (braceCount < 0) {
            console.log(`⚠️  Extra closing brace at line ${i + 1}: ${line.trim()}`);
        }
    }
    console.log(`Brace balance: ${braceCount} (should be 0)`);
    console.log(`Paren balance: ${parenCount} (should be 0)`);
    console.log(`Bracket balance: ${bracketCount} (should be 0)`);
    
    // Check for duplicate const/let declarations at function scope
    const declRegex = /\b(const|let)\s+(\w+)\b/g;
    const declarations = {};
    let declMatch;
    while ((declMatch = declRegex.exec(code)) !== null) {
        const name = declMatch[2];
        if (!declarations[name]) declarations[name] = [];
        // Find line number
        const pos = declMatch.index;
        const beforeText = code.substring(0, pos);
        const lineNum = beforeText.split('\n').length;
        declarations[name].push(lineNum);
    }
    
    const dupes = Object.entries(declarations).filter(([k, v]) => v.length > 1);
    if (dupes.length > 0) {
        console.log('\n⚠️  Variables declared multiple times (potential scope collision):');
        dupes.forEach(([name, lines]) => {
            if (lines.length > 3) return; // Skip common short names in different scopes
            console.log(`  ${name}: lines ${lines.join(', ')}`);
        });
    }
}
