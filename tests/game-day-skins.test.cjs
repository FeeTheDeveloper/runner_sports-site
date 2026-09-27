const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const moduleResult = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../lib/theme/gameDaySkins.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
new Function("module", "exports", code)(moduleResult, moduleResult.exports);
const { GAME_DAY_SKINS, getGameDaySkin } = moduleResult.exports;

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255)
    .map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}

test("every fan skin retains readable action text and expressive captions", () => {
  for (const skin of GAME_DAY_SKINS) {
    assert.ok(contrast("#ffffff", skin.action) >= 4.5, `${skin.id}: button contrast`);
    assert.ok(contrast(skin.accent, "#04081a") >= 4.5, `${skin.id}: accent on canvas`);
    assert.ok(contrast(skin.secondary, skin.wash) >= 4.5, `${skin.id}: preview caption contrast`);
  }
});

test("unknown or malformed persisted preferences resolve to a known safe palette", () => {
  for (const value of [undefined, "", "__proto__", "eagles-kelly; Path=/", "<script>"]) {
    assert.equal(getGameDaySkin(value).id, "runner");
  }
  assert.equal(getGameDaySkin("eagles-kelly").id, "eagles-kelly");
  assert.equal(new Set(GAME_DAY_SKINS.map((skin) => skin.id)).size, 7);
});
