const { encodeExpressions, decodeExpressions, tokenizeHTML } = require('../lib/index');
const { mapDoc } = require('prettier').doc.utils;
const prettier = require('prettier');
const parserr = require('angular-html-parser');

// args: path, print, textToDoc, options
function embed(path, _print, textToDoc, options) {
  const tokens = path.stack[0];

  const isTextWithExpressions = tokens.find((token) => token.type !== 'text');

  if (!isTextWithExpressions) {
    return prettier.format(options.originalText, { ...options, parser: 'html' });
  }

  const [text, expressionMap] = encodeExpressions(tokens);
  // prettier.__debug.formatAST(parsed.ast, { parser: 'html', astFormat: 'html', originalText: parsed.text})
  // console.log(JSON.stringify(parserr.parse(text, { canSelfClose: true }), null, 2));
  // return prettier.__debug.formatAST(parserr.parse(text, { canSelfClose: true }), { ...options, parser: 'html' });
  // prettier.__debug.parse(text, { parser: 'html'  })
  // > prettier.__debug.formatAST(b.ast, { parser: 'html'})
  // return parserr.parse(text, { canSelfClose: true });
  const htmlDoc = textToDoc(text, { parser: 'html' });
  console.log('htmlDoc', JSON.stringify(htmlDoc, null, 2));
  const callback = decodeExpressions(expressionMap);

  const s = mapDoc(htmlDoc, callback);
  return s;
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

// > prettier.__debug.formatAST(parsed.ast, { parser: 'html', astFormat: 'html', originalText: parsed.text})
