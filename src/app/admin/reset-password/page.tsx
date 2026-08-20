import { setNewPassword } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/admin/reset-password">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <form action={setNewPassword} className="w-full max-w-xs flex flex-col gap-3">
        <h1 className="text-lg font-semibold mb-1">Set a new password</h1>
        <input
          type="password"
          name="password"
          placeholder="New password"
          autoFocus
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded border border-line bg-surface px-3 py-2 text-sm"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm new password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded border border-line bg-surface px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          className="rounded bg-accent text-white text-sm font-medium py-2 hover:opacity-90"
        >
          Set password
        </button>
      </form>
    </main>
  );
}
