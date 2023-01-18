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
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeExpressions = void 0;
var encodeExpressions = function (tokens) {
    var expressionMap = new Map();
    // TODO: betterNames
    var open = [];
    var conds = [];
    var id = 0;
    var lastId = 0;
    var firstCond = false;
    var textWithPlaceholders = tokens
        .map(function (token) {
        var type = token.type, subType = token.subType, content = token.content, inElement = token.inElement, afterInlineEndTag = token.afterInlineEndTag, inScript = token.inScript, inComment = token.inComment, afterWhitespace = token.afterWhitespace, inElementWithoutNeedToEncode = token.inElementWithoutNeedToEncode;
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
                    expressionMap.set("eexa".concat(id), __assign({ print: content }, token));
                    return " eexa".concat(id, " ");
                }
                expressionMap.set("<eext".concat(id, ">"), __assign({ print: content }, token));
                var addNewLineBefore = afterWhitespace ? '' : '\n';
                return "".concat(addNewLineBefore, "<eext").concat(id, ">\n");
            }
            case 'plain': {
                id++;
                if (inScript) {
                    expressionMap.set("eexs".concat(id, "eexs"), __assign({ print: content }, token));
                    return "eexs".concat(id, "eexs");
                }
                if (inElement) {
                    expressionMap.set("eex".concat(id, "eex"), __assign({ print: content }, token));
                    return "eex".concat(id, "eex");
                }
                expressionMap.set("<eext".concat(id), __assign({ print: content }, token));
                var addBeforeSpace = afterInlineEndTag ? '' : ' ';
                return "".concat(addBeforeSpace, "<eext").concat(id, " /> ");
            }
            case 'middle':
                lastId = open.pop();
                id++;
                open.push(id);
                if (inElement) {
                    expressionMap.set("eexc".concat(lastId), __assign({ print: '' }, token));
                    expressionMap.set("eexa".concat(id), __assign({ print: content }, token));
                    return " eexc".concat(lastId, " eexa").concat(id, " ");
                }
                expressionMap.set("</eext".concat(lastId, ">"), __assign({ print: '', isMidExpression: true }, token));
                expressionMap.set("<eext".concat(id, ">"), __assign({ print: content, isMidExpression: true }, token));
                return "\n</eext".concat(lastId, "> <eext").concat(id, "> ");
            case 'middle_nested':
                if (!firstCond) {
                    firstCond = true;
                    id++;
                    open.push(id);
                    expressionMap.set("<eext".concat(id, ">"), __assign({ print: content }, token));
                    return "<eext".concat(id, ">\n");
                }
                else {
                    lastId = open.pop();
                    id++;
                    open.push(id);
                    expressionMap.set("</eext".concat(lastId, ">"), { print: '', isMidExpression: true, type: type });
                    expressionMap.set("<eext".concat(id, ">"), { print: content, isMidExpression: true, type: type });
                    return "\n</eext".concat(lastId, "> <eext").concat(id, ">");
                }
            case 'end':
                lastId = open.pop();
                if (open.length && conds.length && conds.includes(open[open.length - 1])) {
                    var condEnd = open.pop();
                    expressionMap.set("</eext".concat(lastId, ">"), __assign({ print: '' }, token));
                    expressionMap.set("</eext".concat(condEnd, ">"), __assign({ print: content }, token));
                    return "</eext".concat(lastId, "> </eext").concat(condEnd, ">");
                }
                if (inElement) {
                    expressionMap.set("eexc".concat(lastId), __assign({ print: content }, token));
                    return " eexc".concat(lastId, " ");
                }
                expressionMap.set("</eext".concat(lastId, ">"), __assign({ print: content }, token));
                return " </eext".concat(lastId, ">");
        }
    })
        .join('');
    if (open.length > 0) {
        // TODO: better error message - show which one isn't closed
        throw 'Missing closing expression';
    }
    return [textWithPlaceholders, expressionMap];
};
exports.encodeExpressions = encodeExpressions;
//# sourceMappingURL=encoder.js.map