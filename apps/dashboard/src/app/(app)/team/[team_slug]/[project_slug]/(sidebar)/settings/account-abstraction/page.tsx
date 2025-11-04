import { redirect } from "next/navigation";

// Redirect old settings/account-abstraction page to new Sponsored Gas Configuration
export default async function Page(props: {
  params: Promise<{ team_slug: string; project_slug: string }>;
}) {
  const { team_slug, project_slug } = await props.params;
  redirect(
    `/team/${team_slug}/${project_slug}/wallets/sponsored-gas/configuration`,
  );
}
