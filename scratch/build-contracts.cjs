const ts = require('../node_modules/typescript/lib/typescript.js');
const path = require('path');
const fs = require('fs');

console.log('TypeScript version:', ts.version);

const configPath = path.resolve('packages/contracts/tsconfig.json');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(configPath)
);

console.log('Files to compile:', parsedConfig.fileNames);

const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const emitResult = program.emit();

const allDiagnostics = ts
  .getPreEmitDiagnostics(program)
  .concat(emitResult.diagnostics);

allDiagnostics.forEach((diagnostic) => {
  if (diagnostic.file) {
    const { line, character } = ts.getLineAndCharacterOfPosition(
      diagnostic.file,
      diagnostic.start
    );
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      '\n'
    );
    console.log(
      `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
    );
  } else {
    console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  }
});

if (emitResult.emitSkipped) {
  console.error('Compilation failed!');
  process.exit(1);
} else {
  console.log('Successfully compiled @docteurflotte/contracts to dist/ !');
}
