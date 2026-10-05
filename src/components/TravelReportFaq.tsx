"use client";

type FaqItem = {
  question: string;
  answer: string;
  href?: string;
  linkLabel?: string;
};

type TravelReportFaqProps = {
  items: FaqItem[];
  title?: string;
  id?: string;
};

export default function TravelReportFaq({
  items,
  title = "Häufige Fragen",
  id = "faq",
}: TravelReportFaqProps) {
  return (
    <section id={id} className="mx-auto mt-16 max-w-3xl scroll-mt-24 px-4 sm:px-6">
      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h2>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-xl border border-stone-200 bg-white shadow-sm open:shadow-md"
          >
            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-stone-900 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                {item.question}
                <span
                  className="shrink-0 text-lg font-normal leading-none text-stone-400 transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </span>
            </summary>
            <div className="border-t border-stone-100 px-4 pb-4 pt-2">
              <p className="text-sm leading-relaxed text-stone-600">{item.answer}</p>
              {item.href && item.linkLabel ? (
                <p className="mt-2">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-sky-700 underline-offset-2 hover:underline"
                  >
                    {item.linkLabel}
                  </a>
                </p>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
