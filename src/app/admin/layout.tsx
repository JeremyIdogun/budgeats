import Link from "next/link";
import { requireAdminPage } from "@/lib/server/auth";

const ADMIN_LINKS = [
  { href: "/admin/runs", label: "Runs" },
  { href: "/admin/products/unmatched", label: "Unmatched" },
  { href: "/admin/products/review", label: "Review Queue" },
  { href: "/admin/ingredients", label: "Ingredients" },
  { href: "/admin/meals", label: "Meals Coverage" },
  { href: "/admin/retailers", label: "Retailers" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage("/admin");

  return (
    <div className="flex min-h-screen">
      <aside className="w-52 shrink-0 bg-navy text-cream flex flex-col">
        <div className="px-5 py-6 border-b border-navy-muted/40">
          <span className="font-heading text-sm font-semibold tracking-widest uppercase text-cream/60">
            Admin
          </span>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-body font-medium text-cream/80 hover:bg-white/10 hover:text-cream transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-cream min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}
