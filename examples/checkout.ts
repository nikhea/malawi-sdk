import { MalawiStore } from "../src/index.js";

const store = new MalawiStore({
  baseUrl: process.env.API_URL ?? "http://localhost:8080/api/v1",
  onTokenChange: ({ token, refreshToken }) => {
    // Replace with your persistence layer.
    console.log("tokens rotated", Boolean(token), Boolean(refreshToken));
  },
});

await store.auth.login({
  email: process.env.EMAIL ?? "customer@example.mw",
  password: process.env.PASSWORD ?? "change-me",
});

await store.cart.addItem({ product_id: "product-id", qty: 2 });
const cart = await store.cart.get();
console.log("Cart total (tambala):", cart.subtotal_cents);

const order = await store.orders.checkout();
console.log("Order", order.id, order.status);

const payment = await store.payments.createIntent(order.id);
console.log("Confirm this client secret with Stripe.js:", payment.client_secret);
console.log("Charged (USD cents):", payment.amount_cents);
