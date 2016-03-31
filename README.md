#Swagger-docgen

Generate beautiful documentation based on your Swagger API. Inspired on
[Twitter's API](https://dev.twitter.com/rest/public), this module will generate
a single html file containing the documention you need, beautifully and
efficiently. No need for servers and extra dependencies.

    npm install swagger-docgen -g
    cat schema.json | doc > index.html

__Note__: This module wont de-reference your files, neither convert from YAML
to JSON, however it needs a de-referenced schema to work as intended.
For that you can use many de-referencers out there.

Shameless plug: [jschema-deref](https://github.com/zanona/jschema-deref).

This way, you could simply run:

    jsderef schema.yaml | doc > index.html
