import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function TravelReportRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/unsere-reisen#${slug}`);
}
