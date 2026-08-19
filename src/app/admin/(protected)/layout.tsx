import Link from "next/link";
import { logout } from "../login/actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line px-6 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="font-semibold">
            Admin
          </Link>
          <Link href="/admin/import" className="text-muted hover:text-accent">
            Import venue
          </Link>
          <Link href="/" className="text-muted hover:text-accent">
            View site
          </Link>
        </nav>
        <form action={logout}>
          <button type="submit" className="text-sm text-muted hover:text-accent">
            Log out
          </button>
        </form>
      </header>
      <div className="flex-1 mx-auto w-full max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}
