# Yargs

[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![NPM version][npm-image]][npm-url]
[![Windows Tests][windows-image]][windows-url]
[![js-standard-style][standard-image]][standard-url]
[![Conventional Commits][conventional-commits-image]][conventional-commits-url]
[![Slack][slack-image]][slack-url]

_Having problems? want to contribute? join our [community slack](http://devtoolscommunity.herokuapp.com)_.

> Yargs be a node.js library fer hearties tryin' ter parse optstrings.

<img width="250" src="/yargs-logo.png">

Yargs helps you build interactive command line tools, by parsing arguments and generating an elegant user interface. It gives you:

* commands and (grouped) options (`my-program.js serve --port=5000`).
* a dynamically generated help menu based on your arguments.

> <img width="400" src="/screen.png">

* bash-completion shortcuts for commands and options.
* and [tons more](/docs/api.md).

## Installation

```bash
npm i yargs --save
```

## Simple Example

````javascript
#!/usr/bin/env node
const argv = require('yargs').argv

if (argv.ships > 3 && argv.distance < 53.5) {
  console.log('Plunder more riffiwobbles!')
} else {
  console.log('Retreat from the xupptumblers!')
}
````

```bash
$ ./plunder.js --ships=4 --distance=22
Plunder more riffiwobbles!

$ ./plunder.js --ships 12 --distance 98.7
Retreat from the xupptumblers!
```

## Complex Example

```js
#!/usr/bin/env node
require('yargs') // eslint-disable-line
  .command('serve [port]', 'start the server', (yargs) => {
    yargs
      .positional('port', {
        describe: 'port to bind on',
        default: 5000
      })
  }, (argv) => {
    if (argv.verbose) console.info(`start server on :${argv.port}`)
    serve(argv.port)
  })
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .argv
```


stop parsing
------------

Use `--` to stop parsing flags and stuff the remainder into `argv._`.

    $ node examples/reflect.js -a 1 -b 2 -- -c 3 -d 4
    { _: [ '-c', '3', '-d', '4' ],
      a: 1,
      b: 2,
      '$0': 'examples/reflect.js' }

negate fields
-------------

If you want to explicitly set a field to false instead of just leaving it
undefined or to override a default you can do `--no-key`.

    $ node examples/reflect.js -a --no-b
    { _: [], a: true, b: false, '$0': 'examples/reflect.js' }

numbers
-------

Every argument that looks like a number (`!isNaN(Number(arg))`) is converted to
one. This way you can just `net.createConnection(argv.port)` and you can add
numbers out of `argv` with `+` without having that mean concatenation,
which is super frustrating.

duplicates
----------

If you specify a flag multiple times it will get turned into an array containing
all the values in order.

    $ node examples/reflect.js -x 5 -x 8 -x 0
    { _: [], x: [ 5, 8, 0 ], '$0': 'examples/reflect.js' }

dot notation
------------

When you use dots (`.`s) in argument names, an implicit object path is assumed.
This lets you organize arguments into nested objects.

    $ node examples/reflect.js --foo.bar.baz=33 --foo.quux=5
    { _: [],
      foo: { bar: { baz: 33 }, quux: 5 },
      '$0': 'examples/reflect.js' }

short numbers
-------------

Short numeric `-n5` style arguments work too:

    $ node examples/reflect.js -n123 -m456
    { _: [], n: 123, m: 456, '$0': 'examples/reflect.js' }

installation
============

With [npm](https://github.com/npm/npm), just do:

    npm install yargs

or clone this project on github:

    git clone http://github.com/yargs/yargs.git

To run the tests with npm, just do:

    npm test

configuration
=============

Using the `yargs` stanza in your `package.json` you can turn on and off
some of yargs' parsing features:

```json
{
  "yargs": {
    "short-option-groups": true,
    "camel-case-expansion": true,
    "dot-notation": true,
    "parse-numbers": true,
    "boolean-negation": true
  }
}
```

See the [yargs-parser](https://github.com/yargs/yargs-parser#configuration) module
for detailed documentation of this feature.
=======
Run the example above with `--help` to see the help for the application.

## Table of Contents

* [Yargs' API](/docs/api.md)
* [Examples](/docs/examples.md)
* [Parsing Tricks](/docs/tricks.md)
  * [Stop the Parser](/docs/tricks.md#stop)
  * [Negating Boolean Arguments](/docs/tricks.md#negate)
  * [Numbers](/docs/tricks.md#numbers)
  * [Arrays](/docs/tricks.md#arrays)
  * [Objects](/docs/tricks.md#objects)
* [Advanced Topics](/docs/advanced.md)
  * [Composing Your App Using Commands](/docs/advanced.md#commands)
  * [Building Configurable CLI Apps](/docs/advanced.md#configuration)
  * [Customizing Yargs' Parser](/docs/advanced.md#customizing)
* [Contributing](/contributing.md)

[travis-url]: https://travis-ci.org/yargs/yargs
[travis-image]: https://img.shields.io/travis/yargs/yargs/master.svg
[coveralls-url]: https://coveralls.io/github/yargs/yargs
[coveralls-image]: https://img.shields.io/coveralls/yargs/yargs.svg
[npm-url]: https://www.npmjs.com/package/yargs
[npm-image]: https://img.shields.io/npm/v/yargs.svg
[windows-url]: https://ci.appveyor.com/project/bcoe/yargs-ljwvf
[windows-image]: https://img.shields.io/appveyor/ci/bcoe/yargs-ljwvf/master.svg?label=Windows%20Tests
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/
[conventional-commits-image]: https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg
[conventional-commits-url]: https://conventionalcommits.org/
[slack-image]: http://devtoolscommunity.herokuapp.com/badge.svg
[slack-url]: http://devtoolscommunity.herokuapp.com
