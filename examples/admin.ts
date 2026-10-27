import { MalawiStore } from "../src/index.js";

const store = new MalawiStore({
  baseUrl: process.env.API_URL ?? "http://localhost:8080/api/v1",
  token: process.env.ADMIN_TOKEN,
});

const category = await store.categories.create({
  name: "Cooking Oil",
  description: "Everyday essentials",
});

const product = await store.products.create({
  category_id: category.id,
  name: "Sunseed Cooking Oil 2L",
  price_cents: 12_500, // K125.00
  currency: "MWK",
});

await store.variants.create(product.id, {
  name: "500ml",
  sku: "OIL-500-001",
  price_cents: 2_500,
});

await store.inventory.setStock({ product_id: product.id, qty: 50 });

console.log("Created", product.slug);
console.log("Stock:", await store.inventory.getStock({ product_id: product.id }));
