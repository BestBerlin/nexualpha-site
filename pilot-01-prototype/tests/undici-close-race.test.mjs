// The web server survives Node 20 undici's "ReadableStream is already closed" race and still crashes on anything else.
import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { installUndiciCloseRaceGuard, isUndiciCloseRace } from "../server/undici-close-race.mjs";

const race = () => Object.assign(new TypeError("Invalid state: ReadableStream is already closed"), { code: "ERR_INVALID_STATE", stack: "TypeError: Invalid state\n    at ReadableByteStreamController.close (node:internal/webstreams/readablestream:1155:13)\n    at node:internal/deps/undici/undici:1615:28" });

test("only the undici close race is ignored", () => {
  assert.equal(isUndiciCloseRace(race()), true);
  assert.equal(isUndiciCloseRace(new Error("boom")), false);
  assert.equal(isUndiciCloseRace(Object.assign(new TypeError("Invalid state: ReadableStream is already closed"), { code: "ERR_INVALID_STATE", stack: "at app.js:1" })), false);
  const proc = new EventEmitter();
  const exits = [];
  proc.exit = (code) => exits.push(code);
  const logs = [];
  const original = console.error; console.error = () => {};
  try {
    installUndiciCloseRaceGuard(proc, (m) => logs.push(m));
    proc.emit("uncaughtException", race(), "uncaughtException");
    assert.deepEqual(exits, []);
    assert.equal(logs.length, 1);
    proc.emit("uncaughtException", new Error("real bug"), "uncaughtException");
    assert.deepEqual(exits, [1]);
  } finally { console.error = original; }
});
