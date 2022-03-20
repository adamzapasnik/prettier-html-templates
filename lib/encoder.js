const encodeExpressions = (tokens) => {
  const expressionMap = new Map();
  // TODO: betterNames
  const open = [];
  const conds = [];
  let id = 0;
  let lastId = 0;
  let firstCond = false;

  // console.log('tt')
  // console.log('tokens', tokens)

  const textWithPlaceholders = tokens
    .map((token) => {
      const {
        type,
        subType,
        content,
        inElement,
        afterInlineEndTag,
        inScript,
        inComment,
        afterWhitespace,
        inElementWithoutNeedToEncode,
      } = token;

      if (inComment || inElementWithoutNeedToEncode) {
        return content;
      }

      switch (type) {
        case 'text':
          return content;

        case 'start': {
          id++;
          open.push(id);

          if (subType === 'nested') {
            conds.push(id);
            firstCond = false;
          }

          if (inElement) {
            expressionMap.set(`eext${id}eexts`, { print: content, ...token });

            // spaces? probably not
            return ` eext${id}eexts `;
          }

          // expressionMap.set(`<eext${id}>`, { print: content, ...token });
          expressionMap.set(`eext${id}`, { print: content, ...token });

          // const addNewLineBefore = afterWhitespace ? '' : '\n';
          // return `${addNewLineBefore}<eext${id}>\n`;
          return `<eext${id}>`;
        }
        case 'plain': {
          id++;

          if (inScript) {
            expressionMap.set(`eexs${id}eexs`, { print: content, ...token });

            return `eexs${id}eexs`;
          }

          if (inElement) {
            expressionMap.set(`eext${id}eext`, { print: content, ...token });

            return `eext${id}eext`;
          }

          // expressionMap.set(`<eext${id}`, { print: content, ...token });
          expressionMap.set(`eext${id}`, { print: content, ...token });


          const addBeforeSpace = afterInlineEndTag ? '' : ' ';

          // return `${addBeforeSpace}<eext${id} /> `;
          return `<eext${id} />`;

        }
        case 'middle':
          lastId = open.pop();
          id++;
          open.push(id);

          if (inElement) {
            expressionMap.set(`eext${lastId}eexte`, { print: '', ...token });
            expressionMap.set(`eext${id}eexts`, { print: content, ...token });

            return ` eext${lastId}eexte eext${id}eexts `;
          }

          // expressionMap.set(`</eext${lastId}>`, { print: '', isMidExpression: true, ...token });
          // expressionMap.set(`<eext${id}>`, { print: content, isMidExpression: true, ...token });
          expressionMap.set(`</eext${lastId}>`, { print: '', isMidExpression: true, ...token });
          expressionMap.set(`eext${id}`, { print: content, isMidExpression: true, ...token });

          return `</eext${lastId}> <eext${id}>`;

        case 'middle_nested':
          if (!firstCond) {
            firstCond = true;
            id++;
            open.push(id);
            expressionMap.set(`<eext${id}>`, { print: content, ...token });

            return `<eext${id}>\n`;
          } else {
            lastId = open.pop();
            id++;
            open.push(id);

            expressionMap.set(`</eext${lastId}>`, { print: '', isMidExpression: true, type: type });
            expressionMap.set(`<eext${id}>`, { print: content, isMidExpression: true, type: type });

            return `\n</eext${lastId}> <eext${id}>`;
          }

        case 'end':
          lastId = open.pop();

          if (open.length && conds.length && conds.includes(open[open.length - 1])) {
            const condEnd = open.pop();

            expressionMap.set(`</eext${lastId}>`, { print: '', ...token });
            expressionMap.set(`</eext${condEnd}>`, { print: content, ...token });

            return `</eext${lastId}> </eext${condEnd}>`;
          }

          if (inElement) {
            expressionMap.set(`eext${lastId}eexte`, { print: content, ...token });

            // TODO: remove spaces?
            return ` eext${lastId}eexte `;
          }

          // expressionMap.set(`</eext${lastId}>`, { print: content, ...token });
          expressionMap.set(`</eext${lastId}>`, { print: content, ...token });
          // do I really need this? kind of yes

          // return ` </eext${lastId}>`;
          return `</eext${lastId}>`
      }
    })
    .join('');

  if (open.length > 0) {
    // TODO: better error message - show which one isn't closed
    throw 'Missing closing expression';
  }

  return [textWithPlaceholders, expressionMap];
};

module.exports = encodeExpressions;
