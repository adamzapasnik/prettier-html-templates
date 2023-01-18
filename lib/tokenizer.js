"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenizeHTML = void 0;
var getLastIndexOfRegexp = function (string, regexp) {
    var match = string.match(new RegExp(regexp, 'mg'));
    return match ? string.lastIndexOf(match[match.length - 1]) : -1;
};
var isWithinElement = function (htmlBeforeExpression, element) {
    var regexp = new RegExp("<".concat(element, "[\\s\\S]*?>"));
    return getLastIndexOfRegexp(htmlBeforeExpression, regexp) > htmlBeforeExpression.lastIndexOf("</".concat(element, ">"));
};
var isInAttribute = function (html) {
    var beginning = html.lastIndexOf('="') + 1;
    if (beginning === 0)
        return false;
    return beginning >= html.lastIndexOf('"');
};
var types = ['plain', 'start', 'end', 'middle', 'middle_nested'];
// nested only used by start
var subTypes = ['nested'];
var validateTypes = function (type, subType) {
    if (!types.includes(type)) {
        throw "Got `".concat(type, "` but valid types include only: ").concat(types.join(', '));
    }
    if (subType && !subTypes.includes(subType)) {
        throw "Got `".concat(subType, "` but valid subTypes include only: ").concat(subTypes.join(', '));
    }
    if (subType === 'nested' && type !== 'start') {
        throw "Got type `".concat(type, "` for subType `nested` but only type `start` is allowed!");
    }
};
var tokenizeHTML = function (text, expressionRegexp, expressionTypeCallback) {
    var closedTags = text.match(/<\/\w+>/gm);
    var uniqueClosedTags = new Set(closedTags);
    var rawElementsInText = [
        'pre',
        'code',
        'samp',
        'kbd',
        'var',
        'ruby',
        'noscript',
        'canvas',
        'style',
        'title',
    ].filter(function (tag) { return uniqueClosedTags.has("</".concat(tag, ">")); });
    // Example: <%[\s\S]*?%>/gm;
    var regexp = new RegExp(expressionRegexp, 'gm');
    var tokens = [];
    var cursorPosition = 0;
    var html = '';
    // Used to detect if expression is in attribute
    // <meta name="apple-itunes-app" content="app-id=<%= apple_id %>" />
    var htmlWithPlaceholders = '';
    text.replace(regexp, function (match, offset) {
        // when two expressions are next to each other <% %><% %>
        // we don't want to create an empty text tag
        if (cursorPosition !== offset) {
            var string = text.slice(cursorPosition, offset);
            tokens.push({ type: 'text', content: string });
            html += string;
            // 'e' is added as an expression replacement to make isInAttribute work
            // Without: `class="` returns false
            // With: `class="e` returns true
            htmlWithPlaceholders += string + 'e';
        }
        cursorPosition = offset + match.length;
        var lastTokenType = tokens.length && tokens[tokens.length - 1].type;
        var beforeWhitespace = /\s/.test(text[offset + match.length]);
        var afterWhitespace = lastTokenType === 'start' || (lastTokenType === 'text' && /\s/.test(html[html.length - 1]));
        var beforeInlineEndTag = /^<\/\w+(?<!address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|li|main|nav|noscript|ol|p|pre|section|table|tfoot|thead|tbody|ul|video|tr|td|th|button)\s*>/.test(text.slice(offset + match.length));
        var afterInlineEndTag = lastTokenType === 'text' &&
            (html.endsWith('/>') || // TODO: FIX THIS meaning <img > instead of <img />
                /<\/\w+(?<!address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|li|main|nav|noscript|ol|p|pre|section|table|tfoot|thead|tbody|ul|video|tr|td|th|button)\s*>$/.test(html));
        var inElement = html.lastIndexOf('<') > html.lastIndexOf('>') || isInAttribute(htmlWithPlaceholders);
        var inComment = html.lastIndexOf('<!--') > html.lastIndexOf('-->');
        var _a = expressionTypeCallback(match), type = _a.type, subType = _a.subType;
        validateTypes(type, subType);
        tokens.push({
            type: type,
            subType: subType,
            content: match,
            afterWhitespace: afterWhitespace,
            beforeWhitespace: beforeWhitespace,
            beforeInlineEndTag: beforeInlineEndTag,
            afterInlineEndTag: afterInlineEndTag,
            inElement: inElement,
            inScript: isWithinElement(html, 'script'),
            inComment: inComment,
            inElementWithoutNeedToEncode: !inElement && !inComment && rawElementsInText.find(function (tag) { return isWithinElement(html, tag); }),
        });
    });
    if (cursorPosition !== text.length) {
        tokens.push({ type: 'text', content: text.slice(cursorPosition) });
    }
    return tokens;
};
exports.tokenizeHTML = tokenizeHTML;
//# sourceMappingURL=tokenizer.js.map