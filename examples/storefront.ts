import { MalawiStore } from "../src/index.js";

const store = new MalawiStore({
  baseUrl: process.env.API_URL ?? "http://localhost:8080/api/v1",
});

const categories = await store.categories.list();
console.log(`Found ${categories.length} categories`);

const products = await store.products.list({ limit: 10 });
for (const product of products) {
  const kwacha = (product.price_cents / 100).toFixed(2);
  console.log(`${product.name} — K${kwacha} (${product.slug})`);
}

if (products[0]) {
  const detail = await store.products.getBySlug(products[0].slug);
  console.log("Variants:", detail.variants.map((variant) => variant.sku));
  console.log("Reviews:", await store.reviews.summary(detail.product.id));
}
