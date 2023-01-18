"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeInTableOrHead = exports.isInTableOrHead = void 0;
var PLACEHOLDER_REGEXP = /<eext\d+/;
var isInTableOrHead = function (parts) {
    for (var _i = 0, _a = parts.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], index = _b[0], part = _b[1];
        if (part === '/>') {
            // TODO: change name
            var shouldBeBreakPoint = parts[index - 2];
            if (typeof shouldBeBreakPoint === 'object' &&
                (shouldBeBreakPoint.type === 'break-parent' || shouldBeBreakPoint.type === 'line')) {
                var partWithEncodedEex = parts[index - 1];
                if (partWithEncodedEex.type === 'group' &&
                    partWithEncodedEex.contents &&
                    typeof partWithEncodedEex.contents.contents === 'string' &&
                    partWithEncodedEex.contents.contents.trim().match(PLACEHOLDER_REGEXP)) {
                    return true;
                }
            }
        }
    }
};
exports.isInTableOrHead = isInTableOrHead;
var decodeInTableOrHead = function (parts, expressionMap) {
    var decodedParts = [];
    for (var _i = 0, _a = parts.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], index = _b[0], part = _b[1];
        if (part === '/>') {
            var shouldBeBreakPointIndex = index - 2;
            // TODO: change name
            if (parts[shouldBeBreakPointIndex].type === 'break-parent' || parts[shouldBeBreakPointIndex].type === 'line') {
                if (parts[index - 1].type === 'group' && PLACEHOLDER_REGEXP.test(parts[index - 1].contents.contents)) {
                    var partWithEncodedEex = decodedParts.pop();
                    var encodedEex = partWithEncodedEex.contents.contents.trim();
                    var original = expressionMap.get(encodedEex);
                    expressionMap.delete(encodedEex);
                    decodedParts.push(original.print);
                    continue;
                }
            }
        }
        decodedParts.push(part);
    }
    return decodedParts;
};
exports.decodeInTableOrHead = decodeInTableOrHead;
//# sourceMappingURL=table_and_head_decoder.js.map