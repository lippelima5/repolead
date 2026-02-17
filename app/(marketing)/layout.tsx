import { AppProviders } from "@/components/app-providers";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
