import assert from 'node:assert/strict';
import test from 'node:test';
import { ChatRequestError, parseChatRequest, toGeminiContents } from '../../../server/chatRequest.ts';

test('accepts supported chat messages and converts an image for Gemini', () => {
  const request = parseChatRequest({
    messages: [
      { role: 'system', content: 'Be concise.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Identify this wine.' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,aGVsbG8=' } },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  const converted = toGeminiContents(request.messages);
  assert.equal(converted.systemInstruction, 'Be concise.');
  assert.deepEqual(converted.contents[0], {
    role: 'user',
    parts: [
      { text: 'Identify this wine.' },
      { inlineData: { mimeType: 'image/png', data: 'aGVsbG8=' } },
    ],
  });
});

test('rejects unsafe or oversized AI request fields before provider calls', () => {
  assert.throws(
    () => parseChatRequest({ messages: [{ role: 'tool', content: 'run this' }] }),
    ChatRequestError,
  );
  assert.throws(
    () => parseChatRequest({ messages: [{ role: 'user', content: 'hello' }], temperature: 3 }),
    ChatRequestError,
  );
  assert.throws(
    () => parseChatRequest({
      messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: 'https://example.test/image.jpg' } }] }],
    }),
    ChatRequestError,
  );
});
