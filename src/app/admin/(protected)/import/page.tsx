import { ImportForm } from "./ImportForm";

export default async function ImportVenuePage({ searchParams }: PageProps<"/admin/import">) {
  const params = await searchParams;
  const publishError = typeof params.publishError === "string" ? params.publishError : null;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-1">Import venue</h1>
      <p className="text-sm text-muted mb-6">
        Paste a venue&apos;s website URL. The model reads the page and drafts the fields below —
        review and correct everything before publishing.
      </p>

      {publishError && <p className="text-sm text-red-500 mb-4">{publishError}</p>}

      <ImportForm />
    </div>
  );
}
