const { execSync } = require('child_process');

const args = process.argv.slice(2);
let cmdToRun = "";

for (let i = 0; i < args.length; i++) {
  // Catch -Command, -c, or anything that resembles the command string argument
  if (args[i].toLowerCase() === '-command' || args[i].toLowerCase() === '-c') {
    cmdToRun = args.slice(i+1).join(' ');
    break;
  }
}

if (!cmdToRun) {
  cmdToRun = args.join(' ');
}

// Sometimes the command is wrapped in single or double quotes
if ((cmdToRun.startsWith('"') && cmdToRun.endsWith('"')) || (cmdToRun.startsWith("'") && cmdToRun.endsWith("'"))) {
  cmdToRun = cmdToRun.slice(1, -1);
}

try {
  const output = execSync(cmdToRun, { encoding: 'utf-8', stdio: 'inherit' });
  if (output) console.log(output);
} catch (e) {
  process.exit(e.status || 1);
}
