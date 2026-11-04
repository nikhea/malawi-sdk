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

function appendFile(form: FormData, file: UploadFile, field: string): void {
  if (typeof Blob !== "undefined" && file instanceof Blob) {
    const name = typeof File !== "undefined" && file instanceof File ? file.name : "upload";
    form.append(field, file, name);
    return;
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
}

/** Builds the single `file` part expected by the admin image endpoints. */
export function createUploadForm(file: UploadFile, field = "file"): FormData {
  const form = new FormData();
  appendFile(form, file, field);
  return form;
}

/** Builds repeated `files` parts for the gallery upload endpoint. */
export function createUploadFormMany(
  files: UploadFile | UploadFile[],
  field = "files",
): FormData {
  const list = Array.isArray(files) ? files : [files];
  if (list.length === 0) {
    throw new TypeError("At least one UploadFile is required");
  }

  const form = new FormData();
  for (const file of list) appendFile(form, file, field);
  return form;
}
