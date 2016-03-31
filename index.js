'use strict';
var marked = require('marked'),
    data   = { paths: {}, tags: {}, info: {}};

marked.setOptions({ smartypants: true });

function formatType($schema) {
    var r = '';
    r += $schema.type;
    if ($schema.format) { r += ':' + $schema.format; }
    return r;
}
function parseSchemaParams($schema, list) {
    list = list || [];
    for (const KEY in $schema.properties) {
        const prop = $schema.properties[KEY],
            required = $schema.required || [];
        if (prop.properties) {
            const parent = {
                name: KEY,
                required: required.indexOf(KEY) >= 0,
                description: '<code>' + KEY + '</code> Object',
                params: []
            };
            list.push(parent);
            parseSchemaParams(prop, parent.params, KEY);
        } else if (prop.items) {
            if (prop.items.properties) {
                const parent = {
                    name: KEY,
                    required: required.indexOf(KEY) >= 0,
                    description: '<code>' + KEY + '</code> Array of Object',
                    params: []
                };
                list.push(parent);
                parseSchemaParams(prop.items, parent.params, KEY);
            } else {
                list.push({
                    name: KEY,
                    required: required.indexOf(KEY) >= 0,
                    description: '<code>' + formatType(prop.items) + '</code> Array'
                });
            }
        } else {
            const parent = {
                name: KEY,
                required: required.indexOf(KEY) >= 0,
                description: '<code>' + formatType(prop) + '</code>'
            };
            if (prop.enum) {
                parent.description += '.<br>Accepted values are '
                    + prop.enum.map(function (item, index, array) {
                        item = '<code>' + item + '</code>';
                        if (index === 0) {
                            return item;
                        } else if (index === array.length - 1) {
                            return ' or ' + item;
                        } else {
                            return ', ' + item;
                        }
                    }).join('');
            }
            list.push(parent);
        }
    }
    return list;
}
function parseSchema($schema, obj) {
    obj = obj || {};
    for (const KEY in $schema.properties) {
        const prop = $schema.properties[KEY];
        if (prop.properties) {
            obj[KEY] = {};
            obj[KEY] = parseSchema(prop, obj[KEY]);
        } else if (prop.items) {
            obj[KEY] = [];
            if (prop.items.properties) {
                obj[KEY].push(parseSchema(prop.items, {}));
            } else {
                obj[KEY].push(formatType(prop.items));
            }
        } else {
            obj[KEY] = formatType(prop);
        }
    }
    return obj;
}
function parseBodyParams(params) {
    var b = params.filter(function (param) { return param.schema; });
    if (b.length) {
        return JSON.stringify(parseSchema(b[0].schema), null, 2)
            .replace(/[\[|\{]\n.*\n.*[\]|\}]/g, function (m) {
                return m.replace(/\n/g, '').replace(/ {2,}/g, ' ');
            })
            .replace(/ {2}/g, '&nbsp;&nbsp;')
            .replace(/\n/g, '<br>')
            .replace(/"boolean"/g, '<span class=bool>true</span>')
            .replace(/"string"/g, '<span class=string>"abc"</span>')
            .replace(/"string:date"/g, '<span class=string>"2016-03-30"</span>')
            .replace(/"string:date-time"/g, '<span class=string>"2016-03-30T19:40:52.343Z"</span>')
            .replace(/"(\w+:.+?)"/g, '<span class=string>"$1"</span>')
            .replace(/"(integer|number)"/g, '<span class=bool>123</span>');
    }
}
function parseParams(params) {
    var p = [];
    for (const PARAM in params) {
        if (params[PARAM].schema) {
            p = p.concat(parseSchemaParams(params[PARAM].schema));
        } else {
            p.push({
                name: params[PARAM].name,
                required: !!params[PARAM].required,
                description: formatType(params[PARAM]) + ' in: ' + params[PARAM].in
            });
        }
    }
    return p;
}
function getTags(method, methodName, pathName) {
    for (const TAG of method.tags) {
        data.tags[TAG] = data.tags[TAG] || [];
        data.tags[TAG].push(methodName.toUpperCase() + ' ' + pathName);
    }
}
function getMethods(path, pathName, params) {
    for (const METHOD in path) {
        if (METHOD.match(/get|post|put|patch|delete|head|options/)) {
            let methodParams = params;
            if (path[METHOD].parameters) {
                methodParams = params.concat(path[METHOD].parameters);
            }
            data.paths[METHOD.toUpperCase() + ' ' + pathName] = {
                id: '/' + METHOD + pathName,
                href: pathName,
                body: parseBodyParams(methodParams),
                method: METHOD.toUpperCase(),
                summary: path[METHOD].summary,
                description: marked(path[METHOD].description || ''),
                params: parseParams(methodParams)
            };
            getTags(path[METHOD], METHOD, pathName);
        }
    }
}
function getPaths($schema) {
    for (const PATH in $schema.paths) {
        var params = $schema.paths[PATH].parameters || [];
        getMethods($schema.paths[PATH], PATH, params);
    }

}

function getSchemaInfo(schema) {
    const info = schema.info || {};
    return {
        title: info.title,
        version: info.version,
        host: schema.host || 'example.com',
        description: info.description ? marked(info.description) : null
    };
}

function init(schema) {
    getPaths(schema); //adjust data obj
    data.info = getSchemaInfo(schema);
    //data      = template(data);
    return data;
}
module.exports = init;
