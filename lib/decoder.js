"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeExpressions = void 0;
var prettier_1 = __importDefault(require("prettier"));
var _a = prettier_1.default.doc.builders, breakParent = _a.breakParent, group = _a.group, line = _a.line;
var attributes_decoder_1 = require("./decoder/attributes_decoder");
var table_and_head_decoder_1 = require("./decoder/table_and_head_decoder");
var html_body_decoder_1 = require("./decoder/html_body_decoder");
var decodeExpressions = function (expressionMap) {
    var opts = { removeWhitespace: false };
    var scriptTagExpressions = [];
    return function (doc) {
        if (!doc.parts || (!expressionMap.size && !opts.removeWhitespace))
            return doc;
        var parts = __spreadArray([], doc.parts, true);
        var decodedParts = [];
        // it also deals with head it seems
        // is in nonTextElement!
        if ((0, table_and_head_decoder_1.isInTableOrHead)(parts)) {
            // deals with non conditional expressions in table/head elements
            var partlyDecodedDoc = __assign(__assign({}, doc), { parts: (0, table_and_head_decoder_1.decodeInTableOrHead)(parts, expressionMap) });
            // deals with the rest of encoded
            return (0, exports.decodeExpressions)(expressionMap)(partlyDecodedDoc);
        }
        if ((0, html_body_decoder_1.isSelfClosingInText)(parts)) {
            var _a = (0, html_body_decoder_1.decodeSelfClosingInText)(parts, expressionMap), removeWhitespace = _a.removeWhitespace, newDecodedParts = _a.decodedParts;
            opts.removeWhitespace = removeWhitespace;
            decodedParts.push.apply(decodedParts, newDecodedParts);
        }
        else if ((0, attributes_decoder_1.isInElement)(parts)) {
            decodedParts.push.apply(decodedParts, (0, attributes_decoder_1.decodeInAttributes)(parts, expressionMap));
        }
        else {
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var part = parts_1[_i];
                if (part === '</script>') {
                    for (var _b = 0, scriptTagExpressions_1 = scriptTagExpressions; _b < scriptTagExpressions_1.length; _b++) {
                        var match = scriptTagExpressions_1[_b];
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
                    var decodedContents = part.contents.replace(/eex\d+eex/g, function (match) {
                        var expression = expressionMap.get(match);
                        expressionMap.delete(match);
                        return expression.print;
                    });
                    decodedParts.push(__assign(__assign({}, part), { contents: decodedContents }));
                    continue;
                }
                // Deals with expressions between script tags
                if (/eexs\d+eexs/.test(part)) {
                    var decodedPart = part.replace(/eexs\d+eexs/, function (match) {
                        var expression = expressionMap.get(match);
                        // Match can't be deleted immediately from expressionMap because it could be reused
                        // That's why we remove them after closing script tag
                        // script.html.test console.log(...)
                        scriptTagExpressions.push(match);
                        return expression.print;
                    });
                    decodedParts.push(decodedPart);
                    continue;
                }
                if ((0, html_body_decoder_1.isSelfClosingAfterOpenTag)(part)) {
                    var placeholder = part.contents.contents.parts[0].contents.contents.trim();
                    if (placeholder.startsWith('/>')) {
                        placeholder = placeholder.substring(2);
                        decodedParts.push('/>');
                    }
                    var expression_1 = expressionMap.get(placeholder);
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
                    if (!expression_1.afterWhitespace && !(decodedParts.length && decodedParts[decodedParts.length - 1].soft)) {
                        decodedParts.pop();
                    }
                    decodedParts.push(expression_1.print);
                    if (!expression_1.beforeWhitespace && expression_1.beforeInlineEndTag) {
                        // ORIGINAL: <span><% e %></span>
                        // WITH:     <span><% e %></span>
                        // WITHOUT:  <span><% e %> </span>
                        // expression.beforeInlineEndTag:
                        // ORIGINAL: <div><% e %></div>
                        // WITH:     <div><% e %></div>
                        // WITHOUT:  (nothing)
                        opts.removeWhitespace = true;
                    }
                    else if (expression_1.beforeWhitespace) {
                        // ORIGINAL: <span><% e %> a</span>
                        // WITH:     <span><% e %> a</span>
                        // WITHOUT:  <span><% e %>a</span>
                        if (part.contents.contents.parts[2] && part.contents.contents.parts[2].type === 'line') {
                            decodedParts.pop();
                            decodedParts.push(group([expression_1.print, line]));
                        }
                    }
                    continue;
                }
                var possibleTag = part.contents || part;
                var expression = /<\/?eext\d+>/.test(possibleTag) && expressionMap.get(possibleTag.trim());
                if (expression) {
                    expressionMap.delete(possibleTag.trim());
                    if (expression.print !== '') {
                        if (expression.isMidExpression) {
                            decodedParts.push([expression.print, breakParent]);
                        }
                        else {
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
                        var lastPart = decodedParts.pop();
                        lastPart.contents.parts.pop();
                        decodedParts.push(lastPart);
                    }
                    continue;
                }
                if (part.join) {
                    var decodedPart = part.join('').replace(/eexs?\d+(?:eexs?)?/g, function (match) {
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
exports.decodeExpressions = decodeExpressions;
//# sourceMappingURL=decoder.js.map