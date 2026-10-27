export type UploadData = Blob | ArrayBuffer | Uint8Array;

/**
 * Anything the SDK can turn into a multipart file part:
 * - a `File`/`Blob` (browser, Node 20+);
 * - a buffer plus metadata, e.g. `{ data: bytes, name: "photo.jpg" }`.
 */
export type UploadFile =
  | Blob
  | {
      data: UploadData;
      name: string;
      type?: string;
    };

/** Builds the `file` part expected by the admin image endpoints. */
export function createUploadForm(file: UploadFile, field = "file"): FormData {
  const form = new FormData();

  if (typeof Blob !== "undefined" && file instanceof Blob) {
    const name = typeof File !== "undefined" && file instanceof File ? file.name : "upload";
    form.append(field, file, name);
    return form;
  }

  if (
    typeof file !== "object" ||
    file === null ||
    !("data" in file) ||
    typeof file.name !== "string"
  ) {
    throw new TypeError(
      "UploadFile must be a Blob/File or an object with { data, name }",
    );
  }

  const blob = new Blob([file.data as BlobPart], {
    type: file.type ?? "application/octet-stream",
  });
  form.append(field, blob, file.name);
  return form;
}
