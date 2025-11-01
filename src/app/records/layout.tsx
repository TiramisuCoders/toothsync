// app/dashboard/layout.tsx
import IdleTimeout from "@/components/IdleTimeout";

export default function recordsLayout({
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
