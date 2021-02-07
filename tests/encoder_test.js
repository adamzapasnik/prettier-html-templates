const { encodeExpressions, tokenizeHTML } = require('../lib');

test('throws error for missing end expression when start present', () => {
  const tokens = tokenizeHTML('<% start %>', /<%[\s\S]*%>/, () => ({ type: 'start' }));

  expect(() => {
    encodeExpressions(tokens);
  }).toThrow('Missing closing expression');
});

test('throws error for missing end expression when middle present', () => {
  const tokens = tokenizeHTML('<% middle %>', /<%[\s\S]*%>/, () => ({ type: 'middle' }));

  expect(() => {
    encodeExpressions(tokens);
  }).toThrow('Missing closing expression');
});

test('throws error for missing end expression when start and middle present', () => {
  const tokens = tokenizeHTML('<% start %><% middle %>', /<%[\s\S]*?%>/, (match) => ({ type: match.match(/\w+/)[0] }));

  expect(() => {
    encodeExpressions(tokens);
  }).toThrow('Missing closing expression');
});
