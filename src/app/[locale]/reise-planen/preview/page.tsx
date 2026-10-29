import { redirect } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function ReisePlanenPreviewRedirect({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/reise-planen", locale: locale as "de" | "en" | "es" });
}
