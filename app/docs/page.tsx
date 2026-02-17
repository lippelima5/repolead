import { redirect } from "next/navigation";
import { DEFAULT_DOC_LANG, DEFAULT_DOC_SLUG } from "@/lib/docs/content";

export default function DocsRootPage() {
  redirect(`/docs/${DEFAULT_DOC_LANG}/${DEFAULT_DOC_SLUG}`);
}
