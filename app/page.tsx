import { getHallsServer } from "@/lib/hallsServer";
import { getUsdToNgnRate } from "@/lib/fx";
import GivingPageClient from "@/components/GivingPageClient";

export const revalidate = 0;

export default async function HomePage() {
  const [{ halls, live }, fxRate] = await Promise.all([getHallsServer(), getUsdToNgnRate()]);
  return <GivingPageClient initialHalls={halls} live={live} fxRate={fxRate} />;
}
