import assert from "node:assert/strict";
import test from "node:test";

import {
  getHttpListenOptions,
  validateMcpAuthRequest,
  validateMcpPostRequest
} from "../src/transports/http.js";

function requestWithHeaders(headers: Record<string, string | string[]>) {
  return {
    headers
  } as const;
}

test("getHttpListenOptions defaults to localhost binding", () => {
  const options = getHttpListenOptions({
    port: 3000,
    httpBindHost: "127.0.0.1"
  } as never);

  assert.deepEqual(options, {
    port: 3000,
    host: "127.0.0.1"
  });
});

test("getHttpListenOptions preserves explicit host override", () => {
  const options = getHttpListenOptions({
    port: 8443,
    httpBindHost: "0.0.0.0"
  } as never);

  assert.deepEqual(options, {
    port: 8443,
    host: "0.0.0.0"
  });
});

test("validateMcpPostRequest rejects transfer-encoding", () => {
  const result = validateMcpPostRequest(
    requestWithHeaders({
      "content-type": "application/json",
      "content-length": "10",
      "transfer-encoding": "chunked"
    }) as never,
    1024
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 400);
    assert.match(result.error, /transfer-encoding/i);
  }
});

test("validateMcpAuthRequest allows requests when no token is configured", () => {
  const result = validateMcpAuthRequest(
    requestWithHeaders({}) as never,
    undefined
  );

  assert.equal(result.ok, true);
});

test("validateMcpAuthRequest rejects missing bearer token when configured", () => {
  const result = validateMcpAuthRequest(
    requestWithHeaders({}) as never,
    "secret"
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
  }
});

test("validateMcpAuthRequest rejects invalid bearer token", () => {
  const result = validateMcpAuthRequest(
    requestWithHeaders({ authorization: "Bearer wrong" }) as never,
    "secret"
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 403);
  }
});

test("validateMcpAuthRequest accepts valid bearer token", () => {
  const result = validateMcpAuthRequest(
    requestWithHeaders({ authorization: "Bearer secret" }) as never,
    "secret"
  );

  assert.equal(result.ok, true);
});

test("validateMcpPostRequest rejects transfer-encoding array", () => {
  const result = validateMcpPostRequest(
    requestWithHeaders({
      "content-type": "application/json",
      "content-length": "10",
      "transfer-encoding": ["chunked"]
    }) as never,
    1024
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 400);
    assert.match(result.error, /transfer-encoding/i);
  }
});

test("validateMcpPostRequest rejects missing content-length", () => {
  const result = validateMcpPostRequest(
    requestWithHeaders({
      "content-type": "application/json"
    }) as never,
    1024
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 411);
  }
});

test("validateMcpPostRequest rejects invalid negative content-length", () => {
  const result = validateMcpPostRequest(
    requestWithHeaders({
      "content-type": "application/json",
      "content-length": "-1"
    }) as never,
    1024
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 400);
  }
});

test("validateMcpPostRequest rejects non-numeric content-length", () => {
  const result = validateMcpPostRequest(
    requestWithHeaders({
      "content-type": "application/json",
      "content-length": "abc"
    }) as never,
    1024
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 400);
  }
});

test("validateMcpPostRequest rejects oversized content-length", () => {
  const result = validateMcpPostRequest(
    requestWithHeaders({
      "content-type": "application/json",
      "content-length": "2048"
    }) as never,
    1024
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 413);
  }
});

test("validateMcpPostRequest accepts bounded JSON request", () => {
  const result = validateMcpPostRequest(
    requestWithHeaders({
      "content-type": "application/json; charset=utf-8",
      "content-length": "256"
    }) as never,
    1024
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.contentLength, 256);
  }
});
