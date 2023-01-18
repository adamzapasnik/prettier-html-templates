import prettier from 'prettier';
const { breakParent, group, line } = prettier.doc.builders;
import { isInElement, decodeInAttributes } from './decoder/attributes_decoder';
import { isInTableOrHead, decodeInTableOrHead } from './decoder/table_and_head_decoder';
import { isSelfClosingInText, decodeSelfClosingInText, isSelfClosingAfterOpenTag } from './decoder/html_body_decoder';

const decodeExpressions = (expressionMap) => {
  const opts = { removeWhitespace: false };
  const scriptTagExpressions = [];

  return (doc) => {
    if (!doc.parts || (!expressionMap.size && !opts.removeWhitespace)) return doc;

    const parts = [...doc.parts];
    const decodedParts = [];

    // it also deals with head it seems
    // is in nonTextElement!
    if (isInTableOrHead(parts)) {
      // deals with non conditional expressions in table/head elements
      const partlyDecodedDoc = { ...doc, parts: decodeInTableOrHead(parts, expressionMap) };
      // deals with the rest of encoded
      return decodeExpressions(expressionMap)(partlyDecodedDoc);
    }

    if (isSelfClosingInText(parts)) {
      const { removeWhitespace, decodedParts: newDecodedParts } = decodeSelfClosingInText(parts, expressionMap);
      opts.removeWhitespace = removeWhitespace;
      decodedParts.push(...newDecodedParts);
    } else if (isInElement(parts)) {
      decodedParts.push(...decodeInAttributes(parts, expressionMap));
    } else {
      for (const part of parts) {
        if (part === '</script>') {
          for (const match of scriptTagExpressions) {
            expressionMap.delete(match);
          }

          decodedParts.push(part);
          continue;
        }
        // ORIGINAL: e <em><% e %></em>.
        // WITH:     e <em><% e %></em>.
        // WITHOUT:  e <em><% e %> </em>.
        if (part === ' ' && opts.removeWhitespace) {
          opts.removeWhitespace = false;

          continue;
        }

        // ORIGINAL: <span><% e %></span>
        // WITH:     <span><% e %></span>
        // WITHOUT:  <span><% e %> </span>
        if (part.type === 'line' && !part.soft && opts.removeWhitespace) {
          opts.removeWhitespace = false;

          continue;
        }

        // <script src="<%= static_url(@conn, "/js/app.js") %>"></script>
        if (/eex\d+eex/.test(part.contents)) {
          const decodedContents = part.contents.replace(/eex\d+eex/g, (match) => {
            const expression = expressionMap.get(match);
            expressionMap.delete(match);

            return expression.print;
          });

          decodedParts.push({ ...part, contents: decodedContents });
          continue;
        }

        // Deals with expressions between script tags
        if (/eexs\d+eexs/.test(part)) {
          const decodedPart = part.replace(/eexs\d+eexs/, (match) => {
            const expression = expressionMap.get(match);
            // Match can't be deleted immediately from expressionMap because it could be reused
            // That's why we remove them after closing script tag
            // script.html.test console.log(...)
            scriptTagExpressions.push(match);

            return expression.print;
          });

          decodedParts.push(decodedPart);
          continue;
        }

        if (isSelfClosingAfterOpenTag(part)) {
          let placeholder = part.contents.contents.parts[0].contents.contents.trim();

          if (placeholder.startsWith('/>')) {
            placeholder = placeholder.substring(2);
            decodedParts.push('/>');
          }

          const expression = expressionMap.get(placeholder);
          expressionMap.delete(placeholder);

          // !expression.afterWhitespace
          // ORIGINAL: <span><% e %></span>
          // WITH:     <span><% e %></span>
          // WITHOUT:  <span> <% e %></span>

          // !decodedParts[decodedParts.length - 1].soft
          // ORIGINAL: <div><% e %></div>
          // WITH:     <div>\n<% e %>\n</div>
          // WITHOUT:  <div><% e %>\n</div>

          // !(decodedParts.length && decodedParts[decodedParts.length - 1].soft)
          // Without first check it breaks double_expression.html.test
          if (!expression.afterWhitespace && !(decodedParts.length && decodedParts[decodedParts.length - 1].soft)) {
            decodedParts.pop();
          }

          decodedParts.push(expression.print);

          if (!expression.beforeWhitespace && expression.beforeInlineEndTag) {
            // ORIGINAL: <span><% e %></span>
            // WITH:     <span><% e %></span>
            // WITHOUT:  <span><% e %> </span>
            // expression.beforeInlineEndTag:
            // ORIGINAL: <div><% e %></div>
            // WITH:     <div><% e %></div>
            // WITHOUT:  (nothing)
            opts.removeWhitespace = true;
          } else if (expression.beforeWhitespace) {
            // ORIGINAL: <span><% e %> a</span>
            // WITH:     <span><% e %> a</span>
            // WITHOUT:  <span><% e %>a</span>
            if (part.contents.contents.parts[2] && part.contents.contents.parts[2].type === 'line') {
              decodedParts.pop();
              decodedParts.push(group([expression.print, line]));
            }
          }

          continue;
        }

        const possibleTag = part.contents || part;

        const expression = /<\/?eext\d+>/.test(possibleTag) && expressionMap.get(possibleTag.trim());

        if (expression) {
          expressionMap.delete(possibleTag.trim());

          if (expression.print !== '') {
            if (expression.isMidExpression) {
              decodedParts.push([expression.print, breakParent]);
            } else {
              decodedParts.push(expression.print);

              if (expression.type === 'start' || expression.type === 'middle_nested') {
                decodedParts.push(breakParent);
              }
            }

            continue;
          }

          if (expression.isMidExpression) {
            opts.removeWhitespace = true;
          }

          // cond end
          // removes empty line
          // TODO: show an example
          if (expression.type === 'end') {
            const lastPart = decodedParts.pop();
            lastPart.contents.parts.pop();
            decodedParts.push(lastPart);
          }

          continue;
        }

        if (part.join) {
          const decodedPart = part.join('').replace(/eexs?\d+(?:eexs?)?/g, (match) => {
            return expressionMap.get(match).print;
          });

          decodedParts.push(decodedPart);
          continue;
        }

        decodedParts.push(part);
      }
    }

    return Object.assign({}, doc, { parts: decodedParts });
  };
};

export default decodeExpressions;
