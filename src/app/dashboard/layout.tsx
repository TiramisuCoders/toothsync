// app/dashboard/layout.tsx
import IdleTimeout from "@/components/IdleTimeout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <IdleTimeout />
      {children}
    </>
  );
}
