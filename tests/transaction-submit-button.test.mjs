import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const code = ts.transpileModule(readFileSync("app/components/TransactionSubmitButton.tsx", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

for (const label of ["Save transaction", "Delete transaction"]) {
  for (const pending of [false, true]) {
    test(`${label}: ${pending ? "spinner replaces text and submission is disabled" : "idle label is visible"}`, () => {
      const exports = {};
      new Function("require", "exports", code)((id) => id === "react-dom" ? { useFormStatus: () => ({ pending }) } : id === "./TransactionSubmitButton.module.css" ? { default: { button: "submit-button", spinner: "loading-spinner" } } : require(id), exports);
      const html = renderToStaticMarkup(React.createElement(exports.TransactionSubmitButton, null, label));
      assert.equal(html.includes('disabled=""'), pending);
      assert.equal(html.includes('class="loading-spinner"'), pending);
      assert.equal(html.includes(label), !pending);
      assert(html.includes(`aria-busy="${pending}"`));
      if (pending) assert(html.includes('aria-label="Processing transaction"'));
    });
  }
}
