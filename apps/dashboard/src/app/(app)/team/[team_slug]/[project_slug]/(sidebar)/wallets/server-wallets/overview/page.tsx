import { createVaultClient, listEoas } from "@thirdweb-dev/vault-sdk";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/api/auth-token";
import { getProject } from "@/api/project/projects";
import { NEXT_PUBLIC_THIRDWEB_VAULT_URL } from "@/constants/public-envs";
import { getClientThirdwebClient } from "@/constants/thirdweb-client.client";
import { TransactionsAnalyticsPageContent } from "../../../transactions/analytics/analytics-page";
import { EngineChecklist } from "../../../transactions/analytics/ftux.client";
import { TransactionAnalyticsSummary } from "../../../transactions/analytics/summary";
import { ServerWalletsTable } from "../../../transactions/components/server-wallets-table.client";
import { getTransactionAnalyticsSummary } from "../../../transactions/lib/analytics";
import type { Wallet } from "../../../transactions/server-wallets/wallet-table/types";
import { listSolanaAccounts } from "../../../transactions/solana-wallets/lib/vault.client";
import type { SolanaWallet } from "../../../transactions/solana-wallets/wallet-table/types";

export const dynamic = "force-dynamic";

export default async function Page(props: {
  params: Promise<{ team_slug: string; project_slug: string }>;
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    interval?: string | string[];
    testTxWithWallet?: string | string[];
    testSolanaTxWithWallet?: string | string[];
    page?: string;
    solana_page?: string;
  }>;
}) {
  const [params, searchParams, authToken] = await Promise.all([
    props.params,
    props.searchParams,
    getAuthToken(),
  ]);

  if (!authToken) {
    redirect(
      `/team/${params.team_slug}/${params.project_slug}/wallets/server-wallets/overview`,
    );
  }

  const [vaultClient, project] = await Promise.all([
    createVaultClient({
      baseUrl: NEXT_PUBLIC_THIRDWEB_VAULT_URL,
    }).catch(() => undefined),
    getProject(params.team_slug, params.project_slug),
  ]);

  if (!project) {
    redirect(`/team/${params.team_slug}`);
  }

  const projectEngineCloudService = project.services.find(
    (service) => service.name === "engineCloud",
  );

  const managementAccessToken =
    projectEngineCloudService?.managementAccessToken;
  const isManagedVault = !!projectEngineCloudService?.encryptedAdminKey;

  const pageSize = 10;
  const currentPage = Number.parseInt(searchParams.page ?? "1");
  const solanaCurrentPage = Number.parseInt(searchParams.solana_page ?? "1");

  const eoas =
    managementAccessToken && vaultClient
      ? await listEoas({
          client: vaultClient,
          request: {
            auth: {
              accessToken: managementAccessToken,
            },
            options: {
              page: currentPage - 1,
              // @ts-expect-error - TODO: fix this
              page_size: pageSize,
            },
          },
        })
      : { data: { items: [], totalRecords: 0 }, error: null, success: true };

  const wallets = eoas.data?.items as Wallet[] | undefined;

  let solanaAccounts: {
    data: { items: SolanaWallet[]; totalRecords: number };
    error: Error | null;
    success: boolean;
  };

  if (managementAccessToken) {
    solanaAccounts = await listSolanaAccounts({
      managementAccessToken,
      page: solanaCurrentPage,
      limit: pageSize,
      projectId: project.id,
    });
  } else {
    solanaAccounts = {
      data: { items: [], totalRecords: 0 },
      error: null,
      success: true,
    };
  }

  const isSolanaPermissionError =
    solanaAccounts.error?.message.includes("AUTH_INSUFFICIENT_SCOPE") ?? false;

  const initialData = await getTransactionAnalyticsSummary({
    clientId: project.publishableKey,
    teamId: project.teamId,
  }).catch(() => undefined);
  const hasTransactions = initialData ? initialData.totalCount > 0 : false;

  const client = getClientThirdwebClient({
    jwt: authToken,
    teamId: project.teamId,
  });

  return (
    <div className="flex flex-col gap-10">
      <EngineChecklist
        isManagedVault={isManagedVault}
        client={client}
        hasTransactions={hasTransactions}
        project={project}
        teamSlug={params.team_slug}
        testTxWithWallet={searchParams.testTxWithWallet as string | undefined}
        testSolanaTxWithWallet={
          searchParams.testSolanaTxWithWallet as string | undefined
        }
        wallets={wallets ?? []}
        solanaWallets={solanaAccounts.data.items}
      />
      {hasTransactions &&
        !searchParams.testTxWithWallet &&
        !searchParams.testSolanaTxWithWallet && (
          <TransactionAnalyticsSummary
            clientId={project.publishableKey}
            initialData={initialData}
            teamId={project.teamId}
          />
        )}

      <TransactionsAnalyticsPageContent
        client={client}
        project={project}
        searchParams={searchParams}
        showAnalytics={
          hasTransactions &&
          !searchParams.testTxWithWallet &&
          !searchParams.testSolanaTxWithWallet
        }
        teamSlug={params.team_slug}
        wallets={wallets}
      />

      {eoas.error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive font-semibold mb-2">
            EVM Wallet Error
          </p>
          <p className="text-sm text-muted-foreground">{eoas.error.message}</p>
        </div>
      ) : (
        <ServerWalletsTable
          client={client}
          evmCurrentPage={currentPage}
          evmTotalPages={Math.ceil(eoas.data.totalRecords / pageSize)}
          evmTotalRecords={eoas.data.totalRecords}
          evmWallets={eoas.data.items as Wallet[]}
          project={project}
          solanaCurrentPage={solanaCurrentPage}
          solanaTotalPages={Math.ceil(
            solanaAccounts.data.totalRecords / pageSize,
          )}
          solanaTotalRecords={solanaAccounts.data.totalRecords}
          solanaWallets={solanaAccounts.data.items}
          teamSlug={params.team_slug}
          solanaPermissionError={isSolanaPermissionError}
          authToken={authToken}
        />
      )}
    </div>
  );
}
