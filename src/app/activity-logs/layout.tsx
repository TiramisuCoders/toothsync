// app/dashboard/layout.tsx
import IdleTimeout from "@/components/IdleTimeout";

export default function activityLogsLayout({
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
