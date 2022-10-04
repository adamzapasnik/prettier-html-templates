const { line } = require('prettier').doc.builders;

const PLACEHOLDER_REGEX = /<eext\d+/;

const isSelfClosingInText = (parts) => {
  if (parts.length !== 2) return;

  const hasLine = parts[0].type === 'line' || parts[0].type === 'if-break';
  const hasOpeningGroup = hasLine && parts[1].type === 'group';
  const hasSelfClosing = hasOpeningGroup && parts[1].contents.parts && parts[1].contents.parts[1] === '/>';

  if (!hasSelfClosing) return;

  return PLACEHOLDER_REGEX.test(parts[1].contents.parts[0].contents.contents);
};

const decodeSelfClosingInText = (parts, expressionMap) => {
  const decodedParts = [];
  let removeWhitespace = false;
  let placeholder = parts[1].contents.parts[0].contents.contents.trim();

  //<span class="js-player-prev-number">4</span><%  %>
  if (placeholder.startsWith('>')) {
    placeholder = placeholder.substring(1);
    decodedParts.push('>');
  }

  const original = expressionMap.get(placeholder);
  expressionMap.delete(placeholder);
  // if-break is present in td
  // <td><strong>Email:</strong> <% sm %><br /></td>
  if (original.afterWhitespace && parts[0].type !== 'if-break') {
    decodedParts.push(line);
  }

  decodedParts.push(original.print);

  // Maintain whitespace if it's there.
  // <%= "alert" %> me
  // Space has to stay between printed `alert` and `me`

  // <p>We published <%=  :sho %> with</p>
  const rest = parts[1].contents.parts.slice(2);
  decodedParts.push(...rest);

  if (parts[2] && parts[2].type === 'line') {
    decodedParts.push(parts[2]);
  }

  // <p><%= @request.submitter.name %> (<%= submitter_name(@request) %>) on <%= ts(@request.inserted_at) %></p>
  if (!original.beforeWhitespace && decodedParts[decodedParts.length - 1].type === 'line') {
    decodedParts.pop();
  }

  // TODO: validate if it's needed!
  // <label>Post to Changelog News <%= help_icon("Disable to publish to audio feed only.") %></label>
  if (!original.beforeWhitespace && original.beforeInlineEndTag) {
    removeWhitespace = true;
  }

  return { decodedParts, removeWhitespace };
};

const decodeInSelfClosingAfterOpenTag = (parts, expressionMap) => {
  const decodedParts = [];
  let removeWhitespace = false;
  let placeholder = parts[0].contents.flat(Infinity).join('').trim();

  //<span class="js-player-prev-number">4</span><%  %>
  if (placeholder.startsWith('>')) {
    placeholder = placeholder.substring(1);
    decodedParts.push('>');
  }

  const original = expressionMap.get(placeholder);
  expressionMap.delete(placeholder);
  // if-break is present in td
  // <td><strong>Email:</strong> <% sm %><br /></td>
  if (original.afterWhitespace && parts[0].type !== 'if-break') {
    decodedParts.push(line);
  }

  decodedParts.push(original.print);

  // Maintain whitespace if it's there.
  // <%= "alert" %> me
  // Space has to stay between printed `alert` and `me`

  // <p>We published <%=  :sho %> with</p>
  const closeIndexMap = findCloseTag(parts);
  const rest = getRest(parts, closeIndexMap);
  decodedParts.push(...rest);

  // if (parts[2] && parts[2].type === 'line') {
  //   decodedParts.push(parts[2]);
  // }

  // <p><%= @request.submitter.name %> (<%= submitter_name(@request) %>) on <%= ts(@request.inserted_at) %></p>
  if (!original.beforeWhitespace && decodedParts[decodedParts.length - 1].type === 'line') {
    decodedParts.pop();
  }

  // TODO: validate if it's needed!
  // <label>Post to Changelog News <%= help_icon("Disable to publish to audio feed only.") %></label>
  if (!original.beforeWhitespace && original.beforeInlineEndTag) {
    removeWhitespace = true;
  }

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

// const findOpenTag = (part) => {
//   const parts = part.flat();
//   // do something
// };
const findOpenTag = (part) => {
  const parts = part.flat(Infinity);
  // reverse for loop
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].type === 'line') {
      continue;
    }
    if (typeof parts[i] === 'string' && parts[i].trim() === '') {
      continue;
    }

    if (parts[i].type === 'group') {
      return findOpenTag(parts[i].contents);
    }

    if (PLACEHOLDER_REGEX.test(parts[i])) return true;

    return false;
  }
};

const findCloseTag = (part) => {
  if (Array.isArray(part)) {
    for (let i = 0; i < part.length; i++) {
      const result = findCloseTag(part[i]);
      if (result === true) return [i];
      if (result) return [i, ...result];
    }
    return false;
  } else if (typeof part === 'object' && 'type' in part && part.type === 'group') {
    for (let i = 0; i < part.contents.length; i++) {
      const result = findCloseTag(part.contents[i]);
      if (result === true) return [i];
      if (result) return [i, ...result];
    }
    return false;
  } else {
    if (typeof part === 'string' && part.trim() === '/>') {
      return true;
    }
    return false;
  }
};

function getRest(part, query) {
  const pointer = query.shift();
  if (pointer === undefined) return [];

  return trim(part, pointer, getRest, query, Boolean(query.length));
}

function trim(part, position, cb, query, inclusive) {
  if (Array.isArray(part)) return [...(inclusive ? [cb(part[position], query)] : []), ...part.slice(position + 1)];
  if (typeof part === 'object' && part.type === 'group')
    return {
      ...part,
      contents: [...(inclusive ? [cb(part.contents[position], query)] : []), ...part.contents.slice(position + 1)],
    };
  if (position !== 0) throw new Error(`Can not trim ${JSON.stringify(part)}`);
  return part;
}

const isSelfClosingAfterOpenTag2 = (part) => {
  const parts = part.flat(Infinity);
  const endTagIndex = parts.findIndex((p) => typeof p === 'string' && p.trim() === '/>');

  if (endTagIndex === -1) return;

  let i = endTagIndex - 1;
  while (i >= 0) {
    if (parts[i].type === 'line') {
      i--;
      continue;
    }
    if (parts[i] === '') {
      i--;
      continue;
    }

    if (parts[i].type === 'group') {
      return findOpenTag(parts[i].contents);
    }

    return false;
  }

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
  decodeInSelfClosingAfterOpenTag,
  isSelfClosingAfterOpenTag2,
  isSelfClosingAfterOpenTag,
};
