import { redirect } from "next/navigation";

type RedirectPageProps = {
  params: {
    workspaceId: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

function buildQuery(searchParams?: Record<string, string | string[] | undefined>) {
  if (!searchParams) {
    return "";
  }

  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      return;
    }

    if (typeof value === "string") {
      query.set(key, value);
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export default function DashboardWorkspaceDetailsRedirectPage({ params, searchParams }: RedirectPageProps) {
  redirect(`/workspaces/${params.workspaceId}${buildQuery(searchParams)}`);
}
