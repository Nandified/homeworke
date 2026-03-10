import { ProviderProfilePage } from "@/components/provider-profile";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <ProviderProfilePage id={id} />;
}
