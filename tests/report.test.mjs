import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { renderToStaticMarkup } = require("react-dom/server");
let rows = [
  { id: 1, created_at: "2026-09-30T16:59:59.999Z", item: "September item", kategori: "Food", jenis: "pengeluaran", nominal: 10 },
  { id: 2, created_at: "2026-09-30T17:00:00Z", item: "October start", kategori: "Food", jenis: "pengeluaran", nominal: 20000 },
  { id: 3, created_at: "2026-10-31T16:59:59.999Z", item: "October end", kategori: "Salary", jenis: "pemasukan", nominal: 100000 },
  { id: 4, created_at: "2026-10-31T17:00:00Z", item: "November item", kategori: "Other", jenis: "pengeluaran", nominal: 30 },
];

function load(file) {
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const mocks = {
    "./report.css": {},
    "next/navigation": { notFound: () => { throw new Error("NOT_FOUND"); } },
    "@/lib/supabase": { getTransactions: async () => rows },
    "@/lib/utils": { translateCategory: (value) => value },
    "@/app/components/AppHeader": { AppHeader: () => null },
  };
  const exports = {};
  new Function("require", "exports", code)((id) => mocks[id] ?? require(id), exports);
  return exports.default;
}

const ReportPage = load("app/report/page.tsx");
const DetailPage = load("app/report/[month]/page.tsx");
const ReportDetailPage = (props) => DetailPage({ searchParams: Promise.resolve({}), ...props });

test("month opens report detail without date filters or export controls", async () => {
  const html = renderToStaticMarkup(await ReportPage());
  assert(html.includes('href="/report/2026-10"'));
  assert(!html.includes('type="date"'));
  assert(!html.includes("Export"));
});

test("detail contains only the month's WIB transactions and matching category totals", async () => {
  const html = renderToStaticMarkup(await ReportDetailPage({ params: Promise.resolve({ month: "2026-10" }) }));
  assert(html.includes("October 2026"));
  assert(html.includes("October start"));
  assert(html.includes("October end"));
  assert(!html.includes("September item"));
  assert(!html.includes("November item"));
  assert(html.includes("Food"));
  assert(html.includes("Salary"));
  assert(html.includes("80.000"));
  assert.match(html, /<b>Food<\/b><small>Rp\s*20\.000<\/small><\/div><em>100%/);
  assert(html.includes('href="/report"'));
  assert(!html.includes("Export"));
});

test("invalid month is rejected and empty months have an empty state", async () => {
  for (const month of ["2026-13", "2026-00", "invalid", "2026-10-01"]) {
    await assert.rejects(() => ReportDetailPage({ params: Promise.resolve({ month }) }), /NOT_FOUND/);
  }
  const html = renderToStaticMarkup(await ReportDetailPage({ params: Promise.resolve({ month: "2026-12" }) }));
  assert(html.includes("No transactions in this month."));
});

test("transactions paginate without changing monthly totals and category breakdown", async () => {
  const originalRows = rows;
  try {
    rows = Array.from({ length: 21 }, (_, index) => ({ id: index, created_at: "2026-10-15T00:00:00Z", item: `Item ${index}`, kategori: "Food", jenis: "pengeluaran", nominal: 1000 }));
    const render = async (page) => renderToStaticMarkup(await ReportDetailPage({ params: Promise.resolve({ month: "2026-10" }), searchParams: Promise.resolve({ page }) }));
    const second = await render("2");
    assert(second.includes("Item 10</th>"));
    assert(second.includes("Item 19</th>"));
    assert(!second.includes("Item 9</th>"));
    assert(!second.includes("Item 20</th>"));
    assert(second.includes("21.000"));
    assert(second.includes('href="/report/2026-10?page=3"'));
    const last = await render("999");
    assert(last.includes("Item 20</th>"));
    assert(!last.includes("Item 19</th>"));
    assert(!last.includes('href="/report/2026-10?page=4"'));
    for (const page of ["invalid", "-2", "1.5"]) {
      const html = await render(page);
      assert(html.includes("Item 0</th>"));
      assert(!html.includes("Item 10</th>"));
    }
  } finally { rows = originalRows; }
});
