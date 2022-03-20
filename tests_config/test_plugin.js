const { mapDoc } = require('prettier').doc.utils;
const prettier = require('prettier');

const preprocess = require("../lib/print-preprocess");

const { parsers: { html: htmlParser } } = require('../lib/parser')
const { print: printHTML, embed: embedHTML} = require('../lib/printer')

const clean = require('../lib/clean')
const printers = {
  'test-ast': {
    embed: embedHTML,
    print: (...args) => {
      const b = printHTML(...args)
      // console.log(JSON.stringify(b, null, 2))
      return b
    },
    preprocess,
    massageAstNode: clean,

  },
};

const { locStart, locEnd } = require("../lib/loc");

const parser = {
  parse: htmlParser.parse,
  astFormat: 'test-ast',
  locEnd,
  locStart
};

module.exports = {
  defaultOptions: {},
  parsers: {
    test: parser,
  },
  printers,
  languages: [
    {
      name: 'html-test',
      parsers: ['test'],
      extensions: ['.html.test'],
    },
  ],
};
