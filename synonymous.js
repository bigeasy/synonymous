const sprintf = require('sprintf-js').sprintf
const assert = require('assert')

const STRING = /^(\s*)([^:(]+)(?:\((\d+(?:\s*,\s*\d+)*)\)|\((\w[\w\d]*(?:\s*,\s*\w[\w\d]*)*)\))?:\s*(.*)$/
const DELIMITER = /^(?:(\s*)___\s+((?:\d+|\w[\w\d]+|\$)(?:\s*,\s*(?:\d+|[\w\d]+|"(?:[^"\\]*(?:\\.[^"\\]*)*)"|\$))*)\s+___\s+((?:[a-z]{2}_[A-Z]{2})(?:\s*,\s*[a-z]{2}_[A-Z]{2})*)\s+___\s*|(\s*)___\s+\.\s+___\s*)$/
const PARAMETER = /^(?:(\w[\w\d]+|\$)|("(?:[^"\\]*(?:\\.[^"\\]*)*)"))\s*(?:,\s*(.*))?$/

// Extract message strings from the strings section of a usage message.
function strings (strings, lines) {
    let dedent = Number.MAX_VALUE

    OUTER: for (let i = 0, I = lines.length; i < I; i++) {
        let $
        if (($ = STRING.exec(lines[i]))) {
            let spaces = $[1].length, key = $[2].trim(), order = $[3] || $[4] || '1', line = $[5], message = []
            if (line.length) message.push(line)
            for (i++; i < I; i++) {
                if (/\S/.test(lines[i])) {
                    $ = /^(\s*)(.*)$/.exec(lines[i])
                    if ($[1].length <= spaces) break
                    dedent = Math.min($[1].length, dedent)
                }
                message.push(lines[i])
            }
            for (let j = line.length ? 1 : 0, J = message.length; j < J; j++) {
                message[j] = message[j].substring(dedent)
            }
            if (message[message.length - 1] == '') message.pop()
            strings[key] = { text: message.join('\n'), order: order.split(/\s*,\s*/) }
            i--
        }
    }

    return strings
}

function Dictionary () {
    this._languages = { order: [], branch: {} }
}

Dictionary.prototype.load = function (source) {
    const lines = source.split(/\r?\n/)
    for (let text, i = 0, I = lines.length; i < I; i++) {
        let $
        if ($ = DELIMITER.exec(lines[i])) {
            const spaces = $[1] == null ? $[4] : $[1], terminator = $[4] != null
            if (text) {
                if (spaces.length > text.indent) {
                    text.body.push(lines[i].substring(text.indent))
                    continue
                }
                text.languages.forEach(function (language) {
                    if (this._languages.order.indexOf(language) == -1) {
                        this._languages.order.push(language)
                    }
                    const branch = this._getBranch(language, text.vargs, true)
                    if (text.areStrings) {
                        strings(branch.strings, text.body)
                    } else {
                        branch.body = text.body.join('\n')
                    }
                }, this)
                text.indent = -1
                text = null
            }
            if (terminator) {
                continue
            }
            text = {
                vargs: [],
                indent: $[1].length,
                parameters: $[2],
                languages: $[3],
                body: [],
                areStrings: false
            }
            while (text.parameters.length) {
                $ = PARAMETER.exec(text.parameters)
                text.vargs.push($[1] ? $[1] : JSON.parse($[2]))
                text.parameters = $[3] || ''
            }
            if (text.areStrings = text.vargs[text.vargs.length - 1] == '$') {
                text.vargs.pop()
            }
            assert(text.vargs.every(function (arg) { return arg != '$' }), 'invalid argument')
            text.languages = text.languages.split(/\s*,\s*/)
        } else if (text) {
            text.body.push(lines[i].substring(text.indent))
        }
    }
}

Dictionary.prototype.getLanguages = function () {
    return this._languages.order.slice()
}

Dictionary.prototype._getBranch = function (language, path, create) {
    let branch = this._languages.branch[language], child
    if (!branch) {
        if (create) {
            branch = this._languages.branch[language] = {
                branches: {},
                name: language,
                strings: {}
            }
        } else {
            return { body: null, strings: {} }
        }
    }
    for (let i = 0, I = path.length; i < I; i++) {
        child = branch.branches[path[i]]
        if (!child) {
            if (create) {
                child = branch.branches[path[i]] = {
                    name: path[i],
                    branches: {},
                    body: null,
                    strings: {}
                }
            } else {
                return { body: null, strings: {} }
            }
        }
        branch = child
    }
    return branch
}

Dictionary.prototype.getText = function (language, path) {
    return this._getBranch(language, path).body
}

Dictionary.prototype.getString = function (language, path, key) {
    return this._getBranch(language, path).strings[key] || null
}

Dictionary.prototype.getKeys = function (language, path) {
    return Object.keys(this._getBranch(language, path).branches)
}

Dictionary.prototype.format = function (language, path, key, ...vargs) {
    const string = this.getString(language, path, key)
    if (!string) {
        return null
    }
    if (typeof vargs[0] === 'object') {
        vargs = vargs[0]
    }
    let args
    if (Array.isArray(vargs)) {
        args = vargs.map(function (_, index) {
            const order = string.order[index] || ''
            return vargs[/^\d+$/.test(order) ? order - 1 : index]
        })
    } else {
        let keys = Object.keys(vargs)
        args = keys.map(function (_, index) {
            const order = string.order[index]
            return vargs[order ? order : keys[index]]
        })
    }
    return sprintf.apply(null, [ string.text].concat(args))
}

module.exports = Dictionary
