function isNonEmptyArray(object) {
  return Array.isArray(object) && object.length > 0;
}

function isFrontMatterNode(node) {
  return node && node.type === "front-matter";
}

function replaceEndOfLineWith(text, replacement) {
  const parts = [];
  for (const part of text.split("\n")) {
    if (parts.length > 0) {
      parts.push(replacement);
    }
    parts.push(part);
  }
  return parts;
}

module.exports = {isNonEmptyArray, isFrontMatterNode, replaceEndOfLineWith}