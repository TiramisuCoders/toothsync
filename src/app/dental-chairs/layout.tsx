// app/dashboard/layout.tsx
import IdleTimeout from "@/components/IdleTimeout";

export default function dentalChairsLayout({
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
