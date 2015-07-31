// Extract message strings from the strings section of a usage message.
function strings (lines) {
    var i, I, j, J, $, spaces, key, order, line, message = [], dedent = Number.MAX_VALUE, strings = {}

    OUTER: for (i = 0, I = lines.length; i < I; i++) {
        if (($ = /^(\s*)([^:(]+)(?:\((\d+(?:\s*,\s*\d+)*)\))?:\s*(.*)$/.exec(lines[i]))) {
            spaces = $[1].length, key = $[2].trim(), order = $[3] || '1', line = $[4], message = []
            if (line.length) message.push(line)
            for (i++; i < I; i++) {
                if (/\S/.test(lines[i])) {
                    $ = /^(\s*)(.*)$/.exec(lines[i])
                    if ($[1].length <= spaces) break
                    dedent = Math.min($[1].length, dedent)
                }
                message.push(lines[i])
            }
            for (j = line.length ? 1 : 0, J = message.length; j < J; j++) {
                message[j] = message[j].substring(dedent)
            }
            if (message[message.length - 1] == '') message.pop()
            strings[key] = { text: message.join('\n'), order: order.split(/\s*,\s*/) }
            i--
        }
    }

    return strings
}

var DELIMITER = /^(\s*)___\s+((?:\w[\w\d]+\$?)(?:\s*,\s*(?:[\w\d]+|"(?:[^"\\]*(?:\\.[^"\\]*)*)"))*)\s+(?:___\s+((?:[a-z]{2}_[A-Z]{2})(?:\s*,\s*[a-z]{2}_[A-Z]{2})*)\s+)?___\s*$/
var PARAMETER = /^(?:(\w[\w\d]+)|("(?:[^"\\]*(?:\\.[^"\\]*)*)"))\s*(?:,\s*(.*))?$/

function redux (source) {
    var dictionary = {}, lines = source.split(/\r?\n/), text, $
    for (var i = 0, I = lines.length; i < I; i++) {
        if ($ = DELIMITER.exec(lines[i])) {
            if (text) {
                if (Array.isArray(text.strings)) {
                    text.strings = strings(text.strings)
                } else {
                    text.body = text.body.join('\n')
                }
                text.languages.forEach(function (language) {
                    var tree = dictionary[language]
                    if (!tree) {
                        tree = dictionary[language] = { branches: {}, name: language }
                    }
                    [ text.name ].concat(text.vargs).forEach(function (varg) {
                        var branch = tree.branches[varg]
                        if (!branch) {
                            branch = tree.branches[varg] = { name: varg, branches: {} }
                        }
                        tree = branch
                    })
                    tree.text = text
                })
            }
            var vargs = [], indent = $[1].length,
                parameters = $[2], languages = $[3]
            $ = /^(\w[\w\d]+)(\$)?(?:\s*,\s*(.*))?$/.exec(parameters)
            var name = $[1], areStrings = $[2], parameters = $[3] || ''
            while (parameters.length) {
                $ = PARAMETER.exec(parameters)
                vargs.push($[1] ? $[1] : JSON.parse($[2]))
                parameters = $[3] || ''
            }
            if (areStrings && text.name === name) {
                text.strings = []
            } else if (languages) {
                languages = languages.split(/\s*,\s*/)
                text = {
                    indent: indent,
                    name: name,
                    vargs: vargs,
                    languages: languages,
                    body: [],
                    strings: {}
                }
            } else {
                text = null
            }
        } else if (text) {
            if (Array.isArray(text.strings)) {
                text.strings.push(lines[i].substring(indent))
            } else {
                text.body.push(lines[i].substring(indent))
            }
        }
    }
    return new Dictionary(dictionary)
}

function Dictionary (root) {
    this._root = root
}

Dictionary.prototype.getText = function (language, path) {
    var branch = this._root[language]
    for (var i = 0, I = path.length; i < I; i++) {
        branch = branch.branches[path[i]]
        if (!branch) {
            return null
        }
    }
    return branch.text.body
}

Dictionary.prototype.getString = function (language, path, key) {
    var branch = this._root[language]
    for (var i = 0, I = path.length; i < I; i++) {
        branch = branch.branches[path[i]]
        if (!branch) {
            return null
        }
    }
    return branch.text.strings[key] || null
}

module.exports = redux
