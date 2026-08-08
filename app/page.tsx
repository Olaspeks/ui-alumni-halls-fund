import { getHallsServer } from "@/lib/hallsServer";
import GivingPageClient from "@/components/GivingPageClient";

export const revalidate = 0;

export default async function HomePage() {
  const { halls, live } = await getHallsServer();
  return <GivingPageClient initialHalls={halls} live={live} />;
}
