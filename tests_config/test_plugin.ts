import prettier from 'prettier';
const { mapDoc } = prettier.doc.utils;

import { encodeExpressions, decodeExpressions, tokenizeHTML } from '../src';

// args: path, print, textToDoc, options
function embed(path, _print, textToDoc, options) {
  const tokens = path.stack[0];

  const isTextWithExpressions = tokens.find((token) => token.type !== 'text');

  if (!isTextWithExpressions) {
    return prettier.format(options.originalText, { ...options, parser: 'html' });
  }

  const [text, expressionMap] = encodeExpressions(tokens);

  const htmlDoc = textToDoc(text, { parser: 'html' });

  const callback = decodeExpressions(expressionMap);

  return mapDoc(htmlDoc, callback);
}

const printers = {
  'test-ast': {
    embed: embed,
  },
};

function parse(text, _parsers, _options) {
  return tokenizeHTML(text, /<%[\s\S]*?%>/gm, (expression) => {
    let type;
    let subType;

    if (/<% start %>/.test(expression)) {
      type = 'start';
    } else if (/<% end %>/.test(expression)) {
      type = 'end';
    } else if (/<% middle %>/.test(expression)) {
      type = 'middle';
    } else if (/<% start_nested %>/.test(expression)) {
      type = 'start';
      subType = 'nested';
    } else if (/<% middle_nested %>/.test(expression)) {
      type = 'middle_nested';
    } else {
      type = 'plain';
    }

    return { type, subType };
  });
}

const parser = {
  parse,
  astFormat: 'test-ast',
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
