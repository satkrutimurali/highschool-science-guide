const assert = require('node:assert/strict');
const { detectQuestionType, generateAnswer } = require('./tutorLogic.js');

const directResponse = generateAnswer('what is my first unit in science 9');
assert.match(directResponse, /first unit/i);
assert.match(directResponse, /science 9/i);

const guidedResponse = generateAnswer('what is photosynthesis');
assert.match(guidedResponse, /Start by/i);
assert.match(guidedResponse, /observations/i);
assert.doesNotMatch(guidedResponse, /Chemistry 11/i);

console.log('All tutor logic checks passed.');
