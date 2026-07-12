const fs = require('fs');
const path = require('path');

function deleteNodeModules(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Directory does not exist: ${dir}`);
        return;
    }

    // If the folder itself is node_modules, delete it and stop nesting
    if (path.basename(dir) === 'node_modules') {
        console.log(`Deleting: ${dir}`);
        fs.rmSync(dir, { recursive: true, force: true });
        return;
    }

    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (err) {
        // Handle permissions or missing directory errors safely
        return;
    }

    for (const file of files) {
        const fullPath = path.join(dir, file);
        
        // Skip common heavy/hidden system directories
        if (file === '.git' || file === '.pnpm-store' || file === '.idea' || file === '.vscode') continue;

        if (fs.statSync(fullPath).isDirectory()) {
            if (file === 'node_modules') {
                console.log(`Deleting: ${fullPath}`);
                fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
                // Recursively look deeper
                deleteNodeModules(fullPath);
            }
        }
    }
}

// Get targets from command line arguments (slice out 'node' and 'script name')
const targets = process.argv.slice(2);

if (targets.length > 0) {
    console.log(`Cleaning specific targets: ${targets.join(', ')}...`);
    targets.forEach(target => {
        // Resolves relative paths based on where you ran the command
        const targetPath = path.resolve(process.cwd(), target);
        deleteNodeModules(targetPath);
    });
} else {
    console.log("No targets specified. Cleaning entire workspace...");
    deleteNodeModules(process.cwd());
}

console.log("✨ Done!");