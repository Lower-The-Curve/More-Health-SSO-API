import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  useGetPublishedTranslations,
  getGetPublishedTranslationsQueryKey,
} from "@workspace/api-client-react";

export type Lang = "en" | "zh";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (en: string, zh: string) => string;
  /**
   * Admin-only: temporarily layer draft overrides on top of published. Used
   * by the translations admin page to preview unpublished work without
   * affecting other users. Pass `null` to clear the preview.
   */
  setPreviewDrafts: (drafts: Record<string, string> | null) => void;
  hasPreviewDrafts: boolean;
};

const LangContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("mh-lang") as Lang) || "en";
  });

  // Published overrides come from a public endpoint. We don't gate the rest
  // of the app on this — translations fall back to the inline `zh` literal
  // until the fetch resolves.
  const overridesQuery = useGetPublishedTranslations({
    query: {
      queryKey: getGetPublishedTranslationsQueryKey(),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const published = overridesQuery.data?.translations ?? null;

  const [previewDrafts, setPreviewDraftsState] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("mh-lang", lang);
    if (typeof document !== "undefined") document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((l) => (l === "en" ? "zh" : "en")), []);

  const t = useCallback(
    (en: string, zh: string) => {
      if (lang !== "zh") return en;
      // Preview drafts win, then published overrides, then inline default.
      if (previewDrafts && en in previewDrafts) return previewDrafts[en];
      if (published && en in published) return published[en];
      return zh;
    },
    [lang, published, previewDrafts],
  );

  const setPreviewDrafts = useCallback(
    (drafts: Record<string, string> | null) => setPreviewDraftsState(drafts),
    [],
  );

  return (
    <LangContext.Provider
      value={{
        lang,
        setLang,
        toggle,
        t,
        setPreviewDrafts,
        hasPreviewDrafts: !!previewDrafts,
      }}
    >
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
