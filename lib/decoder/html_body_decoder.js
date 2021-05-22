const { line, group } = require('prettier').doc.builders;

const PLACEHOLDER_REGEX = /<eext\d+/;

[
  {
    type: 'line',
  },
  {
    type: 'group',
    contents: [
      [
        {
          type: 'group',
          contents: [
            {
              type: 'group',
              contents: [['', '<eext1'], ' ', ''],
              break: false,
            },
            '',
          ],
          break: false,
        },
        ['', ['/>', '']],
      ],
    ],
    break: false,
  },
];

const isSelfClosingInText = (parts) => {
  if (parts.length !== 2) return;
  // console.log('am i here');

  // const hasSelfClosing =
  //   parts[1] && parts[1].length == 2 && parts[1][0] === '' && parts[1][1][0] === '/>' && parts[1][1][1] === '';
  const hasLine = parts[0].type === 'line' || parts[0].type === 'if-break';
  const hasOpeningGroup = hasLine && parts[1].type === 'group';
  const hasSelfClosing =
    hasOpeningGroup && parts[1].contents[0] && parts[1].contents[0][1] && parts[1].contents[0][1][1][0] === '/>';

  if (!hasSelfClosing) return;

  // throw 'ss';
  console.log('passed');

  const tag = parts[1].contents[0][0].contents[0].contents[0][1];
  console.log(tag);
  return PLACEHOLDER_REGEX.test(tag);
};

const decodeSelfClosingInText = (parts, expressionMap) => {
  const decodedParts = [];
  let removeWhitespace = false;

  let placeholder = parts[1].contents[0][0].contents[0].contents[0][1];
  let before = parts[1].contents[0][0].contents[0].contents[0][0];
  // let placeholder = parts[1].contents.parts[0].contents.contents.trim();
  // parts[1].contents.parts.
  //<span class="js-player-prev-number">4</span><%  %>
  if (before.startsWith('>')) {
    decodedParts.push('>');
  }

  const original = expressionMap.get(placeholder);
  expressionMap.delete(placeholder);
  // if-break is present in td
  // <td><strong>Email:</strong> <% sm %><br /></td>
  if (original.afterWhitespace && parts[0].type !== 'if-break') {
    decodedParts.push(line);
  }

  // if (ff === '>') {
  //   decodedParts.push(group(['>', original.print]));
  //   removeWhitespace = true;
  // } else {
  //   decodedParts.push(original.print);
  //   console.log(original);
  //   if (!original.beforeWhitespace) {
  //     removeWhitespace = true;
  //   }
  // }
  decodedParts.push(original.print);

  // Maintain whitespace if it's there.
  // <%= "alert" %> me
  // Space has to stay between printed `alert` and `me`

  // <p>We published <%=  :sho %> with</p>
  const rest = parts[1].contents[0].slice(2);
  decodedParts.push(...rest);
  console.log(decodedParts);

  if (parts[1].contents[1] && parts[1].contents[1].type === 'line') {
    decodedParts.push(parts[1].contents[1]);
  }

  // <p><%= @request.submitter.name %> (<%= submitter_name(@request) %>) on <%= ts(@request.inserted_at) %></p>
  if (!original.beforeWhitespace && decodedParts[decodedParts.length - 1].type === 'line') {
    decodedParts.pop();
  }

  // // TODO: validate if it's needed!
  // // <label>Post to Changelog News <%= help_icon("Disable to publish to audio feed only.") %></label>
  // if (!original.beforeWhitespace && original.beforeInlineEndTag) {
  //   removeWhitespace = true;
  // }

  return { decodedParts, removeWhitespace };
};

const isSelfClosingAfterOpenTag = (part) => {
  if (
    part.type === 'group' &&
    part.contents &&
    part.contents.contents &&
    part.contents.contents.parts &&
    part.contents.contents.parts.length &&
    part.contents.contents.parts[1] === '/>'
  ) {
    return PLACEHOLDER_REGEX.test(part.contents.contents.parts[0].contents.contents);
  }

  return false;
};

module.exports = {
  isSelfClosingInText,
  decodeSelfClosingInText,
  isSelfClosingAfterOpenTag,
};
