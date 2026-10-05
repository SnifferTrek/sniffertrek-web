import { redirect } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function AmalfiReportRedirect({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/reisebericht/cinque-terre", locale: locale as "de" | "en" | "es" });
}
