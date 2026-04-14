export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-w-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--w-800)_0%,_var(--w-900)_70%)]" />
      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
