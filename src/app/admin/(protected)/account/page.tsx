import { changePassword } from "./actions";

export default async function AccountPage({ searchParams }: PageProps<"/admin/account">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const success = params.success === "1";

  return (
    <div className="max-w-sm">
      <h1 className="text-lg font-semibold mb-1">Change password</h1>
      <p className="text-sm text-muted mb-6">Updates the password for this admin account.</p>

      <form action={changePassword} className="flex flex-col gap-3">
        <input
          type="password"
          name="currentPassword"
          placeholder="Current password"
          required
          autoComplete="current-password"
          className="rounded border border-line bg-surface px-3 py-2 text-sm"
        />
        <input
          type="password"
          name="password"
          placeholder="New password"
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
        {success && <p className="text-sm text-accent">Password updated.</p>}
        <button
          type="submit"
          className="rounded bg-accent text-white text-sm font-medium py-2 hover:opacity-90"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
