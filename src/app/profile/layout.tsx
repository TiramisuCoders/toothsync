// app/dashboard/layout.tsx
import IdleTimeout from "@/components/IdleTimeout";

export default function ProfileLayout({
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
