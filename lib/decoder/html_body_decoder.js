"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSelfClosingAfterOpenTag = exports.decodeSelfClosingInText = exports.isSelfClosingInText = void 0;
var prettier_1 = __importDefault(require("prettier"));
var line = prettier_1.default.doc.builders.line;
var PLACEHOLDER_REGEX = /<eext\d+/;
var isSelfClosingInText = function (parts) {
    if (parts.length !== 2)
        return;
    var hasLine = parts[0].type === 'line' || parts[0].type === 'if-break';
    var hasOpeningGroup = hasLine && parts[1].type === 'group';
    var hasSelfClosing = hasOpeningGroup && parts[1].contents.parts && parts[1].contents.parts[1] === '/>';
    if (!hasSelfClosing)
        return;
    return PLACEHOLDER_REGEX.test(parts[1].contents.parts[0].contents.contents);
};
exports.isSelfClosingInText = isSelfClosingInText;
var decodeSelfClosingInText = function (parts, expressionMap) {
    var decodedParts = [];
    var removeWhitespace = false;
    var placeholder = parts[1].contents.parts[0].contents.contents.trim();
    //<span class="js-player-prev-number">4</span><%  %>
    if (placeholder.startsWith('>')) {
        placeholder = placeholder.substring(1);
        decodedParts.push('>');
    }
    var original = expressionMap.get(placeholder);
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
    var rest = parts[1].contents.parts.slice(2);
    decodedParts.push.apply(decodedParts, rest);
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
    return { decodedParts: decodedParts, removeWhitespace: removeWhitespace };
};
exports.decodeSelfClosingInText = decodeSelfClosingInText;
var isSelfClosingAfterOpenTag = function (part) {
    if (part.type === 'group' &&
        part.contents &&
        part.contents.contents &&
        part.contents.contents.parts &&
        part.contents.contents.parts.length &&
        part.contents.contents.parts[1] === '/>') {
        return PLACEHOLDER_REGEX.test(part.contents.contents.parts[0].contents.contents);
    }
    return false;
};
exports.isSelfClosingAfterOpenTag = isSelfClosingAfterOpenTag;
//# sourceMappingURL=html_body_decoder.js.map