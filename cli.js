#!/usr/bin/env node
var run = require('./'),
    template = require('./template'),
    schema = '';
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function () {
    const chunk = process.stdin.read();
    if (chunk !== null) { schema += chunk; }
});
process.stdin.on('end', function () {
    const doc = run(JSON.parse(schema));
    process.stdout.write(template(doc));
});
