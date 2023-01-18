import prettier from 'prettier';
var _a = prettier.doc.builders, indent = _a.indent, hardline = _a.hardline, group = _a.group;
export var isInElement = function (parts) { return parts.some(function (part) { return typeof part === 'string' && part.match(/eex[a|c]?\d+/); }); };
export var decodeInAttributes = function (parts, expressionMap) {
    var partlyDecodedParts = decodeInAttributeValues(parts, expressionMap);
    return decodeInAttributeNames(partlyDecodedParts, expressionMap);
};
var decodeInAttributeNames = function (parts, expressionMap, shouldIndent) {
    if (shouldIndent === void 0) { shouldIndent = false; }
    var decodedParts = [];
    var skipIndex = false;
    for (var _i = 0, _a = parts.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], index = _b[0], part = _b[1];
        if (skipIndex && index <= skipIndex) {
            continue;
        }
        skipIndex = false;
        if (shouldIndent && typeof part === 'object' && part.type === 'line') {
            decodedParts.push(hardline);
            continue;
        }
        if (typeof part !== 'string' || !/^eexa\d+$/.test(part)) {
            decodedParts.push(part);
            continue;
        }
        if (/^eexa\d+$/.test(part)) {
            var endPart = part.replace('a', 'c');
            var endIndex = parts.indexOf(endPart);
            var endOriginal = expressionMap.get(parts[endIndex]);
            expressionMap.delete(parts[endIndex]);
            var indentGroup = parts.slice(index + 1, endIndex);
            var nested = decodeInAttributeNames(indentGroup, expressionMap, true);
            nested.pop(); //removes indented extra line
            var expr = expressionMap.get(part);
            expressionMap.delete(part);
            var list = [expr.print, indent(nested)];
            if (endOriginal.print !== '') {
                list.push(hardline);
                list.push(endOriginal.print);
            }
            decodedParts.push(group(list));
            skipIndex = endIndex;
        }
    }
    return decodedParts;
};
var decodeInAttributeValues = function (parts, expressionMap) {
    var decodedParts = [];
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var part = parts_1[_i];
        if (typeof part !== 'string') {
            decodedParts.push(part);
            continue;
        }
        var decoded = part.replace(/eex\d+eex/g, function (match) {
            var expr = expressionMap.get(match);
            expressionMap.delete(match);
            return expr.print;
        });
        if (!/^eex[a|c]\d+$/.test(decoded)) {
            // class="<% %>" doesn't have whitespace
            decoded = decoded.replace(/\s?eex[a|c]\d+\s/g, function (match) {
                var expr = expressionMap.get(match.trim());
                expressionMap.delete(match.trim());
                return expr.print;
            });
        }
        decodedParts.push(decoded);
    }
    return decodedParts;
};
//# sourceMappingURL=attributes_decoder.js.map