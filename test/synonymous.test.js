var usage = '\
usage: synonymous <options> file1 file2\n\
\n\
options:\n\
    --foo'

/*

    ___ usage, sub ___ en_US ___
    usage: synonymous <options> file1 file2

    options:
        --foo
    ___ usage, sub, $ ___ en_US ___

        multi line:
          One line.

          And then another.
        immediate:
          No space before or after.
        following: Message follows label.

        main message:
          This is the main message: %s => %d.

        delimiteresque:
          ___ usage, sub, $ ___ en_US ___

        named parameters(key, value):
          Here are some named parameters: %s => %d && %d.

        plural(number, number):
          There are %d %(number/numbers).

    ___ usage, "string with \"" ___ en_US ___
    x
    ___ usage ___ en_GB ___
    usage: synonymous <options> file1 file2

    options:
        --foo
    ___ . ___

*/
describe('synonymous', () => {
    it('can do all this stuff', () => {
    const assert = require('assert')
    const Dictionary = require('..')
    const fs = require('fs')
    const source = fs.readFileSync(__filename, 'utf8')
    const dictionary = new Dictionary
    dictionary.load(source)
    assert.deepStrictEqual(dictionary.getText('en_US', [ 'usage', 'sub' ]), usage, 'text')
    assert.deepStrictEqual(dictionary.getText('en_US', [ 'usage', 'string with "' ]), 'x', 'double quoted text')
    assert.deepStrictEqual(dictionary.getText('en_US', [ 'usage', 'foo' ]), null, 'text not found')
    // TODO Probably should convert order to integers.
    assert.deepStrictEqual(dictionary.getString('en_US', [ 'usage', 'sub' ], 'main message'), {
        text: 'This is the main message: %s => %d.', order: [ '1' ]
    }, 'string found')
    assert.deepStrictEqual(dictionary.getString('en_US', [ 'usage', 'foo' ], 'main message'), null, 'string path not found')
    assert.deepStrictEqual(dictionary.getString('en_US', [ 'usage', 'sub' ], 'x'), null, 'string not found')
    assert.deepStrictEqual(dictionary.getString('en_US', [ 'usage', 'sub' ], 'delimiteresque'),
          { text: '___ usage, sub, $ ___ en_US ___', order: [ '1' ] },
          'ignore delimiter if indented')
    assert.deepStrictEqual(dictionary.getString('en_US', [ 'usage', 'sub' ], 'named parameters'), {
        text: 'Here are some named parameters: %s => %d && %d.',
        order: [ 'key', 'value' ]
    }, 'string not found')
    assert.deepStrictEqual(dictionary.format('en_US', [ 'usage', 'sub' ], 'named parameters', {
        key: 'a', value: 1, fred: 2
    }), 'Here are some named parameters: a => 1 && 2.', 'format')
    assert.deepStrictEqual(dictionary.format('en_US', [ 'usage', 'sub' ], 'main message', [
        'a', 1
    ]), 'This is the main message: a => 1.', 'format')
    assert.deepStrictEqual(dictionary.format('en_US', [ 'usage', 'sub' ], 'main message', 'a', 1),
        'This is the main message: a => 1.', 'format')
    assert.deepStrictEqual(dictionary.format('en_US', [ 'usage', 'sub' ], 'missing message', []), null, 'missing message')
    assert.deepStrictEqual(dictionary.getString('fr_FR', [ 'usage', 'sub' ], 'x'), null, 'language not found')
    assert.deepStrictEqual(dictionary.getText('en_GB', [ 'usage' ]), usage, 'last entry')
    assert.deepStrictEqual(dictionary.getKeys('en_US', []), [ 'usage' ], 'root keys')
    assert.deepStrictEqual(dictionary.getKeys('en_US', [ 'usage' ]), [ 'sub', 'string with "' ], 'keys')
    assert.deepStrictEqual(dictionary.getLanguages(), [ 'en_US', 'en_GB' ], 'get languages')
    })
})
