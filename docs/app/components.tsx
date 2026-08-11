import { codeToHtml } from 'shiki';

export async function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const html = await codeToHtml(code, {
    lang,
    theme: 'github-dark-default',
  });

  return (
    <div
      className="my-3 overflow-x-auto rounded-xl border border-[#263050] bg-[#0d1117] p-4 text-xs [&_pre]:!bg-transparent [&_pre]:leading-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[#263050] py-6 first:border-0 first:pt-0">
      <h2 className="mb-3 text-xl font-bold text-[#e8ecf8]">
        <span className="mr-2 text-[#6ea8fe]">{number}.</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-6 text-[#93a0c4]">{children}</div>
    </section>
  );
}

export function ComingSoon({ provider }: { provider: string }) {
  return (
    <article className="rounded-[18px] border border-[#263050] bg-[#141a2e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <span className="mb-3 inline-block rounded-full border border-[#263050] px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-[#6ea8fe]">
        Provider guide
      </span>
      <h1 className="text-3xl font-bold">{provider} provider</h1>
      <p className="mt-3 text-sm text-[#93a0c4]">Coming soon.</p>
    </article>
  );
}
