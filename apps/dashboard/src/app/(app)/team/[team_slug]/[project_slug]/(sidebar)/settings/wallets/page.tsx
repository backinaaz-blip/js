import { redirect } from "next/navigation";

// Redirect old settings/wallets page to new User Wallets Configuration
export default async function Page(props: {
  params: Promise<{ team_slug: string; project_slug: string }>;
}) {
  const { team_slug, project_slug } = await props.params;
  redirect(
    `/team/${team_slug}/${project_slug}/wallets/user-wallets/configuration`,
  );
}
