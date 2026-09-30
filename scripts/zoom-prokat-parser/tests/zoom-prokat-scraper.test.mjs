import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import { load } from "cheerio";

import {
  allProductsUrlForCategory,
  catalogToRows,
  extractPrices,
  extractProducts,
  extractCinemaMount,
  extractRootCategories,
  extractSubcategories,
  parseRubles,
  writeCatalogXlsx,
} from "../scripts/zoom-prokat.mjs";

const fixture = `
  <div class="x_cat_list">
    <div class="x_cat_name"><a href="/index.php?categoryID=731&amp;category_slug=arenda-fotokamery">Фотокамеры</a></div>
    <div class="x_cat_name"><a href="/index.php?categoryID=732&amp;category_slug=arenda-videokamery">Видеокамеры</a></div>
    <div class="x_cat_name"><a href="/index.php?categoryID=731">Фотокамеры</a></div>
    <div class="x_cat_name"><a href="/index.php?categoryID=773">Светофильтры</a></div>
  </div>
  <form class="product_brief_block" rel="3835">
    <input name="productID" value="3835" />
    <table class="prdbrief_name"><tr><td><a href="/index.php?productID=3835">Canon 5D Mark III body</a></td></tr></table>
    <!-- historical inactive pricing table must not be read
    <table class="x_cat_table_price">
      <tr><td>Рабочий день</td><td>Выходной день</td><td>Неделя</td><td>Месяц</td></tr>
      <tr><td class="x_cat_table_price_p">0р.</td><td class="x_cat_table_price_p">985р.</td><td class="x_cat_table_price_p">5800р.</td><td class="x_cat_table_price_p">19200р.</td></tr>
    </table>
    -->
    <table class="x_cat_table_price">
      <tr><td>Сутки</td><td>Неделя</td><td>Месяц</td></tr>
      <tr><td><div class="x_cat_table_price_p">985р.</div></td><td><div class="x_cat_table_price_p">5800р.</div></td><td><div class="x_cat_table_price_p">19200р.</div></td></tr>
      <tr><td colspan="3">Нашли дешевле? Снизим цену!</td></tr>
    </table>
  </form>
`;

test("extracts only root catalog categories and removes duplicates", () => {
  assert.deepEqual(
    extractRootCategories(fixture).map(({ id, name }) => ({ id, name })),
    [
      { id: "732", name: "Видеокамеры" },
      { id: "731", name: "Фотокамеры" },
    ],
  );
});

test("excludes the root filter category", () => {
  assert.equal(
    extractRootCategories(fixture).some(({ id }) => id === "773"),
    false,
  );
});

test("extracts lens mount subcategories from the category page", () => {
  const html = `
    <div id="x_search_p_list">
      <div class="n_cat_category">
        <p class="n_cat_p"><a href="?categoryID=567">Canon EF и EF-S</a></p>
      </div>
      <div class="n_cat_category">
        <p class="n_cat_p"><a href="?categoryID=569">Sony E</a></p>
      </div>
    </div>
  `;

  assert.deepEqual(
    extractSubcategories(html).map(({ id, name }) => ({ id, name })),
    [
      { id: "567", name: "Canon EF и EF-S" },
      { id: "569", name: "Sony E" },
    ],
  );
});

test("builds an all-products category URL", () => {
  const url = new URL(
    allProductsUrlForCategory(
      "https://zoom-prokat.ru/index.php?categoryID=731&category_slug=arenda-fotokamery&offset=20",
    ),
  );
  assert.equal(url.searchParams.get("categoryID"), "731");
  assert.equal(url.searchParams.get("category_slug"), "arenda-fotokamery");
  assert.equal(url.searchParams.get("show_all"), "yes");
  assert.equal(url.searchParams.get("offset"), null);
});

test("parses ruble values without turning missing text into zero", () => {
  assert.equal(parseRubles("1 985р."), 1985);
  assert.equal(parseRubles("985,50 руб."), 985.5);
  assert.equal(parseRubles("по запросу"), null);
});

test("extracts the active daily price, not the commented historical table", () => {
  const $ = load(fixture);
  const card = $("form.product_brief_block").first();
  assert.deepEqual(extractPrices($, card), {
    day: 985,
    week: 5800,
    month: 19200,
  });
});

test("extracts product identity and category", () => {
  const products = extractProducts(
    fixture,
    {
      id: "731",
      name: "Фотокамеры",
      url: "https://zoom-prokat.ru/index.php?categoryID=731",
    },
    "https://zoom-prokat.ru/index.php?categoryID=731&ukey=index.php&show_all=yes",
  );

  assert.equal(products.length, 1);
  assert.deepEqual(products[0], {
    id: "3835",
    name: "Canon 5D Mark III body",
    url: "https://zoom-prokat.ru/index.php?productID=3835",
    prices: { day: 985, week: 5800, month: 19200 },
    categories: [
      {
        id: "731",
        name: "Фотокамеры",
        url: "https://zoom-prokat.ru/index.php?categoryID=731",
      },
    ],
    sourceUrl:
      "https://zoom-prokat.ru/index.php?categoryID=731&ukey=index.php&show_all=yes",
  });
});

test("normalizes cinema lens bayonets into the category", () => {
  assert.equal(extractCinemaMount("DZOFilm Prime (FF, ARRI PL)"), "PL");
  assert.equal(extractCinemaMount("Laowa Cine (FF, Canon RF)"), "Canon RF");

  const products = extractProducts(
    fixture.replace(
      "Canon 5D Mark III body",
      "DZOFilm VESPID Prime 50 (FF, ARRI PL)",
    ),
    {
      id: "747",
      name: "Кинообъективы",
      url: "https://zoom-prokat.ru/index.php?categoryID=747",
    },
    "https://zoom-prokat.ru/index.php?categoryID=747&ukey=index.php&show_all=yes",
  );

  assert.equal(products[0].categories[0].id, "747:mount:PL");
  assert.equal(products[0].categories[0].name, "Кинообъективы PL");
});

test("converts the catalog to the three-column Excel schema", () => {
  assert.deepEqual(
    catalogToRows({
      products: [
        {
          name: "Canon 5D Mark III body",
          prices: { day: 985, week: 5800, month: 19200 },
          categories: [{ name: "Фотокамеры" }],
        },
      ],
    }),
    [
      {
        category: "Фотокамеры",
        name: "Canon 5D Mark III body",
        price_per_day_rub: 985,
      },
    ],
  );
});

test("writes one structured XLSX worksheet with typed daily prices", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "zoom-prokat-test-"));
  const outputPath = path.join(directory, "zoom-prokat-prices.xlsx");
  try {
    await writeCatalogXlsx(
      {
        source: { fetchedAt: "2026-09-30T12:00:00.000Z" },
        products: [
          {
            name: "Canon 5D Mark III body",
            prices: { day: 985, week: 5800, month: 19200 },
            categories: [{ name: "Фотокамеры" }],
          },
        ],
      },
      outputPath,
    );

    await writeCatalogXlsx(
      {
        source: { fetchedAt: "2026-09-30T13:00:00.000Z" },
        products: [
          {
            name: "Canon EOS R5 body",
            prices: { day: 2485, week: 14500, month: 48000 },
            categories: [{ name: "Фотокамеры" }],
          },
        ],
      },
      outputPath,
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(outputPath);
    const sheet = workbook.getWorksheet("equipment_prices");
    assert.ok(sheet);
    assert.deepEqual(sheet.getRow(1).values.slice(1, 4), [
      "category",
      "name",
      "price_per_day_rub",
    ]);
    assert.deepEqual(sheet.getRow(2).values.slice(1, 4), [
      "Фотокамеры",
      "Canon EOS R5 body",
      2485,
    ]);
    assert.equal(sheet.rowCount, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
