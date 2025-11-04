import { redirect } from "next/navigation";
import { getAuthToken } from "@/api/auth-token";
import { getProject } from "@/api/project/projects";
import { ProjectPage } from "@/components/blocks/project-page/project-page";
import { getClientThirdwebClient } from "@/constants/thirdweb-client.client";
import { WalletProductIcon } from "@/icons/WalletProductIcon";
import { loginRedirect } from "@/utils/redirects";

export default async function WalletsLayout(props: {
  children: React.ReactNode;
  params: Promise<{ team_slug: string; project_slug: string }>;
}) {
  const params = await props.params;
  const [authToken, project] = await Promise.all([
    getAuthToken(),
    getProject(params.team_slug, params.project_slug),
  ]);

  if (!authToken) {
    loginRedirect(
      `/team/${params.team_slug}/${params.project_slug}/wallets/user-wallets`,
    );
  }

  if (!project) {
    redirect(`/team/${params.team_slug}`);
  }

  const client = getClientThirdwebClient({
    jwt: authToken,
    teamId: project.teamId,
  });

  return (
    <ProjectPage
      header={{
        actions: null,
        client,
        description:
          "Build and manage wallets for every use case — from embedded onboarding flows to secure server signing and gas sponsorship.",
        icon: WalletProductIcon,
        links: [
          {
            type: "docs",
            href: "https://portal.thirdweb.com/wallets",
          },
          {
            type: "playground",
            href: "https://playground.thirdweb.com/wallets/in-app-wallet",
          },
          {
            type: "api",
            href: "https://api.thirdweb.com/reference#tag/wallets",
          },
        ],
        title: "Wallets",
      }}
    >
      {props.children}
    </ProjectPage>
  );
}
