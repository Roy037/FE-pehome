// Run with: node scripts/check-rich-description.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const filename = path.resolve(__dirname, '../src/components/client/rich-description.tsx');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
loaded._compile(compiled, filename);
const render = html => renderToStaticMarkup(React.createElement(loaded.exports.default, { html }));

const result = render('<h1>Details</h1><p style="color:red" onclick="alert(1)">Safe <strong>content</strong></p><script>alert(1)</script><iframe src="https://evil.example"></iframe><svg onload="alert(1)"></svg><a href="javascript:alert(1)" onclick="alert(1)">Unsafe</a><img src="data:image/svg+xml,bad" onerror="alert(1)"><a href="https://example.com/job">Company</a>');
assert(result.includes('<h3>Details</h3>'));
assert(result.includes('<strong>content</strong>'));
assert(!/script|iframe|svg|onclick|onerror|javascript:|style=|data:/i.test(result));
assert(result.includes('href="https://example.com/job"'));
assert(result.includes('rel="noopener noreferrer"'));
assert(!render('<a href="java&#x09;script:alert(1)">Encoded</a>').includes('href='));
assert(render('').includes('chưa cập nhật'));
console.log('Rich description security checks passed.');
