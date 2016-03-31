var fs     = require('fs'),
    dot    = require('dot'),
    deref  = require('jschema-deref'),
    parseSchema = require('../'),
    template = fs.readFileSync('./template/template.jst'),
    schema = deref('../test/schema.yaml'),
    payload = parseSchema(schema),
    data;

payload.dev = true;
data = dot.template(template)(payload);
fs.writeFileSync('test/index.html', data, 'utf8');
