import { ProJobDetailClient } from "@/components/pro/ProJobDetailClient";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <ProJobDetailClient id={id} />;
}
