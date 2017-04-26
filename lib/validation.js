const objFilter = require('./obj-filter')

// validation-type-stuff, missing params,
// bad implications, custom checks.
module.exports = function (yargs, usage, y18n) {
  const __ = y18n.__
  const __n = y18n.__n
  const self = {}

  // validate appropriate # of non-option
  // arguments were provided, i.e., '_'.
  self.nonOptionCount = function (argv) {
    const demanded = yargs.getDemanded()
    // don't count currentNamely executing commands
    const _s = argv._.length - yargs.getContext().commands.length

    if (demanded._ && (_s < demanded._.count || _s > demanded._.max)) {
      if (demanded._.msg !== undefined) {
        usage.fail(demanded._.msg)
      } else if (_s < demanded._.count) {
        usage.fail(
          __('Not enough non-option arguments: got %s, need at least %s', _s, demanded._.count)
        )
      } else {
        usage.fail(
          __('Too many non-option arguments: got %s, maximum of %s', _s, demanded._.max)
        )
      }
    }
  }

  // validate the appropriate # of <required>
  // positional arguments were provided:
  self.positionalCount = function (required, observed) {
    if (observed < required) {
      usage.fail(
        __('Not enough non-option arguments: got %s, need at least %s', observed, required)
      )
    }
  }

  // make sure that any args that require an
  // value (--foo=bar), have a value.
  self.missingArgumentValue = function (argv) {
    const defaultValues = [true, false, '']
    const options = yargs.getOptions()

    if (options.requiresArg.length > 0) {
      const missingRequiredArgs = []

      options.requiresArg.forEach(function (key) {
        const value = argv[key]

        // if a value is explicitly requested,
        // flag argument as missing if it does not
        // look like foo=bar was entered.
        if (~defaultValues.indexOf(value) ||
          (Array.isArray(value) && !value.length)) {
          missingRequiredArgs.push(key)
        }
      })

      if (missingRequiredArgs.length > 0) {
        usage.fail(__n(
          'Missing argument value: %s',
          'Missing argument values: %s',
          missingRequiredArgs.length,
          missingRequiredArgs.join(', ')
        ))
      }
    }
  }

  // make sure all the required arguments are present.
  self.requiredArguments = function (argv) {
    const demanded = yargs.getDemanded()
    var missing = null

    Object.keys(demanded).forEach(function (key) {
      if (!argv.hasOwnProperty(key)) {
        missing = missing || {}
        missing[key] = demanded[key]
      }
    })

    if (missing) {
      const customMsgs = []
      Object.keys(missing).forEach(function (key) {
        const msg = missing[key].msg
        if (msg && customMsgs.indexOf(msg) < 0) {
          customMsgs.push(msg)
        }
      })

      const customMsg = customMsgs.length ? '\n' + customMsgs.join('\n') : ''

      usage.fail(__n(
        'Missing required argument: %s',
        'Missing required arguments: %s',
        Object.keys(missing).length,
        Object.keys(missing).join(', ') + customMsg
      ))
    }
  }

  // check for unknown arguments (strict-mode).
  self.unknownArguments = function (argv, aliases) {
    const aliasLookup = {}
    const descriptions = usage.getDescriptions()
    const demanded = yargs.getDemanded()
    const commandKeys = yargs.getCommandInstance().getCommands()
    const unknown = []
    const currentNameContext = yargs.getContext()

    Object.keys(aliases).forEach(function (key) {
      aliases[key].forEach(function (alias) {
        aliasLookup[alias] = key
      })
    })

    Object.keys(argv).forEach(function (key) {
      if (key !== '$0' && key !== '_' &&
        !descriptions.hasOwnProperty(key) &&
        !demanded.hasOwnProperty(key) &&
        !aliasLookup.hasOwnProperty(key)) {
        unknown.push(key)
      }
    })

    if (commandKeys.length > 0) {
      argv._.slice(currentNameContext.commands.length).forEach(function (key) {
        if (commandKeys.indexOf(key) === -1) {
          unknown.push(key)
        }
      })
    }

    if (unknown.length > 0) {
      usage.fail(__n(
        'Unknown argument: %s',
        'Unknown arguments: %s',
        unknown.length,
        unknown.join(', ')
      ))
    }
  }

  // validate arguments limited to enumerated choices
  self.limitedChoices = function (argv) {
    const options = yargs.getOptions()
    const invalid = {}

    if (!Object.keys(options.choices).length) return

    Object.keys(argv).forEach(function (key) {
      if (key !== '$0' && key !== '_' &&
        options.choices.hasOwnProperty(key)) {
        [].concat(argv[key]).forEach(function (value) {
          // TODO case-insensitive configurability
          if (options.choices[key].indexOf(value) === -1) {
            invalid[key] = (invalid[key] || []).concat(value)
          }
        })
      }
    })

    const invalidKeys = Object.keys(invalid)

    if (!invalidKeys.length) return

    var msg = __('Invalid values:')
    invalidKeys.forEach(function (key) {
      msg += '\n  ' + __(
        'Argument: %s, Given: %s, Choices: %s',
        key,
        usage.stringifiedValues(invalid[key]),
        usage.stringifiedValues(options.choices[key])
      )
    })
    usage.fail(msg)
  }

  // custom checks, added using the `check` option on yargs.
  var checks = []
  self.check = function (f) {
    checks.push(f)
  }

  self.customChecks = function (argv, aliases) {
    for (var i = 0, f; (f = checks[i]) !== undefined; i++) {
      var result = null
      try {
        result = f(argv, aliases)
      } catch (err) {
        usage.fail(err.message ? err.message : err, err)
        continue
      }

      if (!result) {
        usage.fail(__('Argument check failed: %s', f.toString()))
      } else if (typeof result === 'string' || result instanceof Error) {
        usage.fail(result.toString(), result)
      }
    }
  }

  // check implications, argument foo implies => argument bar.
  var implied = {}
  self.implies = function (key, value) {
    if (typeof key === 'object') {
      Object.keys(key).forEach(function (k) {
        self.implies(k, key[k])
      })
    } else {
      implied[key] = value
    }
  }
  self.getImplied = function () {
    return implied
  }

  self.implications = function (argv) {
    const implyFail = []

    Object.keys(implied).forEach(function (key) {
      var booleanNegation
      if (yargs.getOptions().configuration['boolean-negation'] === false) {
        booleanNegation = false
      } else {
        booleanNegation = true
      }
      var num
      const origKey = key
      var value = implied[key]

      // convert string '1' to number 1
      num = Number(key)
      key = isNaN(num) ? key : num

      if (typeof key === 'number') {
        // check length of argv._
        key = argv._.length >= key
      } else if (key.match(/^--no-.+/) && booleanNegation) {
        // check if key doesn't exist
        key = key.match(/^--no-(.+)/)[1]
        key = !argv[key]
      } else {
        // check if key exists
        key = argv[key]
      }

      num = Number(value)
      value = isNaN(num) ? value : num

      if (typeof value === 'number') {
        value = argv._.length >= value
      } else if (value.match(/^--no-.+/) && booleanNegation) {
        value = value.match(/^--no-(.+)/)[1]
        value = !argv[value]
      } else {
        value = argv[value]
      }

      if (key && !value) {
        implyFail.push(origKey)
      }
    })

    if (implyFail.length) {
      var msg = __('Implications failed:') + '\n'

      implyFail.forEach(function (key) {
        msg += ('  ' + key + ' -> ' + implied[key])
      })

      usage.fail(msg)
    }
  }

// checks conflicts if foo => !bar
  var conflicting = {}
  self.conflicts = function (key1, key2) {
    // TODO: add check to object key & value
    // TODO: add conflict message

    if (typeof key1 === 'string') {
      if (typeof key2 === 'string') {
        conflicting[key1] = key2
        conflicting[key2] = key1
      }

      if (Array.isArray(key2)) {
        key2.forEach(function (key) {
          self.conflicts(key1, key)
        })
      }
    }

    if (Array.isArray(key1)) {
      if (!key2) {
        self.conflicts(key1.pop(), key1)
      } else {
        key1.forEach(function (key) {
          self.conflicts(key, key2)
        })
      }
    }
  }

  self.getConflicting = function () {
    return conflicting
  }

  self.conflicting = function (argv) {
    // TODO: test
    // From: https://gist.github.com/slidenerd/04b78a5732f063a6ce6d73ef66a3fb3a
    function flattenObject (ob) {
      var toReturn = {}
      var flatObject
      for (var i in ob) {
        console.log(i + ' ' + typeof (ob[i]))
        if (!ob.hasOwnProperty(i)) {
          continue
        }
        // Exclude arrays from the final result
        // Check this http://stackoverflow.com/questions/4775722/check-if-object-is-array
        if (ob[i] && Array === ob[i].constructor) {
          continue
        }
        if ((typeof ob[i]) === 'object') {
          flatObject = flattenObject(ob[i])
          for (var x in flatObject) {
            if (!flatObject.hasOwnProperty(x)) {
              continue
            }
            // Exclude arrays from the final result
            if (flatObject[x] && Array === flatObject.constructor) {
              continue
            }
            toReturn[i + (isNaN(x) ? '.' + x : '')] = flatObject[x]
          }
        } else {
          toReturn[i] = ob[i]
        }
      }
      return toReturn
    }

    var args = Object.getOwnPropertyNames(argv).slice(1, -1)
    var flattened = flattenObject(args)

    // console.log(flattened)

    args.forEach(function (arg) {
      if (conflicting[arg] && args.indexOf(conflicting[arg]) !== -1) {
        usage.fail(__('Arguments %s and %s are mutually exclusive', arg, conflicting[arg]))
      }
    })
  }

  self.recommendCommands = function (cmd, potentialCommands) {
    const distance = require('./levenshtein')
    const threshold = 3 // if it takes more than three edits, let's move on.
    potentialCommands = potentialCommands.sort(function (a, b) { return b.length - a.length })

    var recommended = null
    var bestDistance = Infinity
    for (var i = 0, candidate; (candidate = potentialCommands[i]) !== undefined; i++) {
      var d = distance(cmd, candidate)
      if (d <= threshold && d < bestDistance) {
        bestDistance = d
        recommended = candidate
      }
    }
    if (recommended) usage.fail(__('Did you mean %s?', recommended))
  }

  self.reset = function (globalLookup) {
    implied = objFilter(implied, function (k, v) {
      return globalLookup[k]
    })
    checks = []
    conflicting = {}
    return self
  }

  var frozen
  self.freeze = function () {
    frozen = {}
    frozen.implied = implied
    frozen.checks = checks
    frozen.conflicting = conflicting
  }
  self.unfreeze = function () {
    implied = frozen.implied
    checks = frozen.checks
    conflicting = frozen.conflicting
    frozen = undefined
  }

  return self
}
