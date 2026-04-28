import PackingSlipLayout from "@/app/packingSlipLayout";

export default function PackingSlipsRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PackingSlipLayout>{children}</PackingSlipLayout>;
}
