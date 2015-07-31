var usage = '\
usage: synonymous <options> file1 file2\n\
\n\
options:\n\
    --foo'

require('proof')(6, prove)

/*

    ___ usage, sub ___ en_US ___
    usage: synonymous <options> file1 file2

    options:
        --foo
    ___ usage$ ___
        multi line:
          One line.

          And then another.
        immediate:
          No space before or after.
        following: Message follows label.

        main message:
          This is the main message: %s.
    ___ usage, "string with \"" ___ en_US ___
    x
    ___ usage ___ en_GB ___
    usage: synonymous <options> file1 file2

    options:
        --foo
    ___ usage ___

*/

function prove (assert) {
    var synonymous = require('../..')
    var fs = require('fs')
    var source = fs.readFileSync(__filename, 'utf8')
    var dictionary = synonymous(source)
    assert(dictionary.getText('en_US', [ 'usage', 'sub' ]), usage, 'text')
    assert(dictionary.getText('en_US', [ 'usage', 'string with "' ]), 'x', 'double quoted text')
    assert(dictionary.getText('en_US', [ 'usage', 'foo' ]), null, 'text not found')
    assert(dictionary.getString('en_US', [ 'usage', 'sub' ], 'main message'), {
        text: 'This is the main message: %s.', order: [ '1' ]
    }, 'string found')
    assert(dictionary.getString('en_US', [ 'usage', 'foo' ], 'main message'), null, 'string path not found')
    assert(dictionary.getString('en_US', [ 'usage', 'sub' ], 'x'), null, 'string not found')
}
