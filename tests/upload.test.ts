import { describe, expect, it } from "vitest";
import { MalawiStore, type UploadFile } from "../src/index.js";
import { headerOf, jsonResponse, recordingFetch } from "./helpers.js";

const BASE = "https://api.malawi.test/api/v1";

function uploadStore() {
  const recorder = recordingFetch(() =>
    jsonResponse({ data: { status: "queued" } }, 202),
  );
  const store = new MalawiStore({
    baseUrl: BASE,
    token: "access",
    fetch: recorder.fetch,
  });
  return { store, recorder };
}

const file: UploadFile = {
  data: new Uint8Array([137, 80, 78, 71]),
  name: "photo.png",
  type: "image/png",
};

describe("image uploads", () => {
  it("posts a multipart file for a product", async () => {
    const { store, recorder } = uploadStore();

    const result = await store.products.uploadImage("p1", file);

    expect(result).toEqual({ status: "queued" });
    const [call] = recorder.calls;
    expect(call?.url).toBe(`${BASE}/admin/products/p1/image`);
    expect(call?.init.method).toBe("POST");
    expect(call?.init.body).toBeInstanceOf(FormData);

    const form = call?.init.body as FormData;
    const part = form.get("file");
    expect(part).toBeInstanceOf(Blob);
    expect((part as File).name).toBe("photo.png");
    expect((part as Blob).type).toBe("image/png");
    expect(headerOf(call!.init, "content-type")).toBeUndefined();
  });

  it("posts a multipart file for a category", async () => {
    const { store, recorder } = uploadStore();

    await store.categories.uploadImage("c1", file);

    const [call] = recorder.calls;
    expect(call?.url).toBe(`${BASE}/admin/categories/c1/image`);
    expect(call?.init.body).toBeInstanceOf(FormData);
  });

  it("accepts a Blob directly", async () => {
    const { store, recorder } = uploadStore();

    await store.products.uploadImage("p1", new Blob(["hello"], { type: "text/plain" }));

    const form = recorder.calls[0]?.init.body as FormData;
    expect(form.get("file")).toBeInstanceOf(Blob);
  });

  it("rejects malformed upload values", async () => {
    const { store } = uploadStore();

    await expect(
      store.products.uploadImage("p1", { name: "x" } as unknown as UploadFile),
    ).rejects.toBeInstanceOf(TypeError);
  });
});
