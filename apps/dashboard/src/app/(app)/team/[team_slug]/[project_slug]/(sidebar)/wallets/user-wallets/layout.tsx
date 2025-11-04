import { TabPathLinks } from "@/components/ui/tabs";

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ team_slug: string; project_slug: string }>;
}) {
  const params = await props.params;
  const basePath = `/team/${params.team_slug}/${params.project_slug}/wallets/user-wallets`;

  return (
    <div className="flex flex-col gap-6">
      <TabPathLinks
        links={[
          {
            name: "Overview",
            path: `${basePath}/overview`,
          },
          {
            name: "Configuration",
            path: `${basePath}/configuration`,
          },
        ]}
      />
      {props.children}
    </div>
  );
}
