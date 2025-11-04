// app/dashboard/layout.tsx
import IdleTimeout from "@/components/IdleTimeout";

export default function reportsLayout({
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
