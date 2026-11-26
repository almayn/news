import { compactTemplateHtml } from "./template";

export default function CompactTemplatePage() {
  return (
    <main className="w-full overflow-hidden bg-[#f2f5fa]">
      <iframe
        title="قالب أخبار الماس المختصر"
        srcDoc={compactTemplateHtml}
        allow="clipboard-read; clipboard-write"
        className="block h-[calc(100dvh-74px)] min-h-[900px] w-full border-0"
      />
    </main>
  );
}
