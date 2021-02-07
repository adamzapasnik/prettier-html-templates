const { tokenizeHTML } = require('../lib');

test('throws an error when type incorrect', () => {
  expect(() =>
    tokenizeHTML('<% %>', /<% %>/gm, () => {
      return { type: 'unknown' };
    })
  ).toThrow('Got `unknown` but valid types include only: plain, start, end, middle, middle_nested');
});

test("throws an error when subType `nested` isn't used with type `start`", () => {
  expect(() =>
    tokenizeHTML('<% %>', /<% %>/gm, () => {
      return { type: 'end', subType: 'nested' };
    })
  ).toThrow('Got type `end` for subType `nested` but only type `start` is allowed');
});

test('throws an error when subType incorrect', () => {
  expect(() =>
    tokenizeHTML('<% %>', /<% %>/gm, () => {
      return { type: 'start', subType: 'unknown' };
    })
  ).toThrow('Got `unknown` but valid subTypes include only: nested');
});
