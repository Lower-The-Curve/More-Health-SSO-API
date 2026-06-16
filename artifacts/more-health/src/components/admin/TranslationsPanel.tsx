import { useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Upload,
  Eye,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Search,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  useAdminGetTranslations,
  useAdminPutTranslationDrafts,
  useAdminPublishTranslations,
  useAdminDiscardTranslationDrafts,
  getAdminGetTranslationsQueryKey,
  getGetPublishedTranslationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import catalogJson from "@/lib/i18n.catalog.generated.json";

// Bundled at build time by the extraction script (`pnpm --filter
// @workspace/scripts run extract-i18n`). When devs add/remove t() calls,
// re-run that script to refresh this catalog.
const CATALOG = catalogJson as {
  generatedAt: string;
  count: number;
  entries: Array<{ en: string; zh: string }>;
};

// --- CSV helpers ------------------------------------------------------------
// RFC 4180-style: wrap in quotes when the value contains comma/quote/newline,
// and double internal quotes.
function csvEscape(v: string): string {
  if (v === "") return "";
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function buildCsv(rows: Array<{ en: string; zh: string }>): string {
  // BOM so Excel opens UTF-8 correctly. Header row first.
  const header = "english,chinese";
  const body = rows.map((r) => `${csvEscape(r.en)},${csvEscape(r.zh)}`).join("\n");
  return "\uFEFF" + header + "\n" + body + "\n";
}

// Permissive CSV parser. Handles quoted fields, doubled quotes, CRLF, and
// a leading BOM. Only takes the first two columns; ignores trailing ones.
function parseCsv(text: string): Array<{ en: string; zh: string }> {
  let i = 0;
  if (text.charCodeAt(0) === 0xfeff) i = 1;
  const out: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      row.push(field);
      field = "";
      out.push(row);
      row = [];
      // Eat CRLF as one terminator
      if (ch === "\r" && text[i + 1] === "\n") i += 2;
      else i++;
      continue;
    }
    field += ch;
    i++;
  }
  // Trailing field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    out.push(row);
  }
  // Strip header if it looks like one
  if (out.length > 0) {
    const h0 = (out[0][0] ?? "").trim().toLowerCase();
    const h1 = (out[0][1] ?? "").trim().toLowerCase();
    if (h0 === "english" && h1 === "chinese") out.shift();
  }
  return out
    .filter((r) => r.length >= 2 && (r[0] !== "" || r[1] !== ""))
    .map((r) => ({ en: r[0] ?? "", zh: r[1] ?? "" }));
}

// --- Component --------------------------------------------------------------

type RowStatus = "unchanged" | "new-draft" | "edit-draft" | "published-only";

interface MergedRow {
  en: string;
  zhDefault: string; // inline literal from source
  zhPublished: string | null;
  zhDraft: string | null;
  status: RowStatus;
}

export function TranslationsPanel() {
  const { t, setPreviewDrafts, hasPreviewDrafts } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const stateQuery = useAdminGetTranslations();
  const putDrafts = useAdminPutTranslationDrafts();
  const publishMut = useAdminPublishTranslations();
  const discardMut = useAdminDiscardTranslationDrafts();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "drafts" | "published">("all");
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [previewOn, setPreviewOn] = useState(false);
  const [importReport, setImportReport] = useState<{
    parsed: number;
    matched: number;
    unmatched: string[];
    skippedSameAsBaseline: number;
  } | null>(null);

  const published = stateQuery.data?.published ?? {};
  const drafts = stateQuery.data?.drafts ?? {};

  // Toggle preview by syncing drafts into context.
  const togglePreview = (next: boolean) => {
    setPreviewOn(next);
    setPreviewDrafts(next ? drafts : null);
  };

  // Re-apply preview whenever drafts change while preview is on.
  if (previewOn && hasPreviewDrafts) {
    // Cheap noop guard — only push when reference changes
  }

  const merged: MergedRow[] = useMemo(() => {
    const byEn = new Map<string, MergedRow>();
    for (const e of CATALOG.entries) {
      byEn.set(e.en, {
        en: e.en,
        zhDefault: e.zh,
        zhPublished: published[e.en] ?? null,
        zhDraft: drafts[e.en] ?? null,
        status: "unchanged",
      });
    }
    // Include override-only rows (strings present in DB but no longer in source)
    for (const en of Object.keys({ ...published, ...drafts })) {
      if (!byEn.has(en)) {
        byEn.set(en, {
          en,
          zhDefault: "",
          zhPublished: published[en] ?? null,
          zhDraft: drafts[en] ?? null,
          status: "published-only",
        });
      }
    }
    for (const row of byEn.values()) {
      if (row.zhDraft != null && row.zhDraft !== (row.zhPublished ?? row.zhDefault)) {
        row.status = row.zhPublished != null ? "edit-draft" : "new-draft";
      } else if (row.zhPublished != null && row.zhPublished !== row.zhDefault) {
        row.status = "published-only";
      } else {
        row.status = "unchanged";
      }
    }
    return [...byEn.values()].sort((a, b) => a.en.localeCompare(b.en));
  }, [published, drafts]);

  const draftCount = useMemo(
    () => merged.filter((r) => r.status === "new-draft" || r.status === "edit-draft").length,
    [merged],
  );
  const publishedCount = Object.keys(published).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return merged.filter((r) => {
      if (filter === "drafts" && !(r.status === "new-draft" || r.status === "edit-draft"))
        return false;
      if (filter === "published" && r.zhPublished == null) return false;
      if (!q) return true;
      return (
        r.en.toLowerCase().includes(q) ||
        r.zhDefault.toLowerCase().includes(q) ||
        (r.zhPublished ?? "").toLowerCase().includes(q) ||
        (r.zhDraft ?? "").toLowerCase().includes(q)
      );
    });
  }, [merged, search, filter]);

  // --- Download ---
  const handleDownload = () => {
    // Export the *current effective* Chinese for each key — draft if present,
    // else published, else inline default. Gives translators a single source
    // of truth to edit.
    const rows = merged.map((r) => ({
      en: r.en,
      zh: r.zhDraft ?? r.zhPublished ?? r.zhDefault,
    }));
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `morehealth-translations-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: t("CSV downloaded", "已下载 CSV") });
  };

  // --- Upload ---
  const handleFile = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);

    // Compute the BASELINE Chinese for each key (published override if any,
    // else the inline default). Anything in the CSV that differs from
    // baseline becomes a draft; anything that matches baseline stays out of
    // drafts entirely. This is crucial: the backend PUT replaces the draft
    // set wholesale, so the CSV must encode the COMPLETE desired draft set
    // — not a delta against existing drafts. Otherwise re-uploading the
    // same CSV would silently drop any drafts that weren't re-submitted.
    const baseline = new Map<string, string>();
    for (const r of merged) {
      baseline.set(r.en, r.zhPublished ?? r.zhDefault);
    }

    const incomingDrafts: Record<string, string> = {};
    const unmatched: string[] = [];
    let skippedSameAsBaseline = 0;
    let matched = 0;
    for (const { en, zh } of rows) {
      if (!en) continue;
      if (!baseline.has(en)) {
        unmatched.push(en);
        continue;
      }
      matched++;
      // If the Chinese matches the published/default baseline, no draft is
      // needed (and any existing draft for this key will be cleared).
      if (zh === baseline.get(en)) {
        skippedSameAsBaseline++;
        continue;
      }
      incomingDrafts[en] = zh;
    }

    // Stage as drafts via PUT (wholesale replace). The server clears any
    // previously-staged drafts and applies the new set.
    try {
      await putDrafts.mutateAsync({ data: { drafts: incomingDrafts } });
      await qc.invalidateQueries({ queryKey: getAdminGetTranslationsQueryKey() });
      setImportReport({
        parsed: rows.length,
        matched,
        unmatched: unmatched.slice(0, 20),
        skippedSameAsBaseline,
      });
      toast({
        title: t("Drafts staged", "草稿已暂存"),
        description: t(
          `${Object.keys(incomingDrafts).length} changes staged as drafts.`,
          `已暂存 ${Object.keys(incomingDrafts).length} 项更改为草稿。`,
        ),
      });
    } catch (e) {
      toast({
        title: t("Import failed", "导入失败"),
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    // Reset so re-uploading the same file fires the change handler again.
    e.target.value = "";
  };

  const handlePublish = async () => {
    try {
      await publishMut.mutateAsync();
      await Promise.all([
        qc.invalidateQueries({ queryKey: getAdminGetTranslationsQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetPublishedTranslationsQueryKey() }),
      ]);
      // Turn off preview — published state is now live.
      setPreviewOn(false);
      setPreviewDrafts(null);
      setConfirmPublish(false);
      toast({ title: t("Translations published", "翻译已发布") });
    } catch (e) {
      toast({
        title: t("Publish failed", "发布失败"),
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDiscard = async () => {
    try {
      await discardMut.mutateAsync();
      await qc.invalidateQueries({ queryKey: getAdminGetTranslationsQueryKey() });
      setPreviewOn(false);
      setPreviewDrafts(null);
      setConfirmDiscard(false);
      toast({ title: t("Drafts discarded", "草稿已丢弃") });
    } catch (e) {
      toast({
        title: t("Discard failed", "丢弃失败"),
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  if (stateQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Translations", "翻译")}</CardTitle>
          <CardDescription>
            {t(
              `${CATALOG.count} strings in catalog · ${publishedCount} published overrides · ${draftCount} pending drafts`,
              `目录共 ${CATALOG.count} 条字符串 · ${publishedCount} 项已发布覆盖 · ${draftCount} 项待发布草稿`,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              {t("Download CSV", "下载 CSV")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={putDrafts.isPending}
            >
              {putDrafts.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {t("Upload CSV", "上传 CSV")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onFileChange}
            />
            <div className="flex-1" />
            <div className="flex items-center gap-2 pr-2 border-r">
              <Eye className="w-4 h-4 text-slate-500" />
              <Label htmlFor="preview-toggle" className="text-xs cursor-pointer">
                {t("Preview drafts in my session", "在我的会话中预览草稿")}
              </Label>
              <Switch
                id="preview-toggle"
                checked={previewOn}
                disabled={draftCount === 0}
                onCheckedChange={togglePreview}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDiscard(true)}
              disabled={draftCount === 0 || discardMut.isPending}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("Discard drafts", "丢弃草稿")}
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirmPublish(true)}
              disabled={draftCount === 0 || publishMut.isPending}
            >
              {publishMut.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {t(`Publish ${draftCount} draft${draftCount === 1 ? "" : "s"}`, `发布 ${draftCount} 项草稿`)}
            </Button>
          </div>

          {previewOn && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0" />
              {t(
                "Preview is on — drafts are layered on top of published in your session only. Switch the language toggle to 中 in the header to see Chinese.",
                "预览已开启 — 仅在您当前会话中将草稿叠加在已发布之上。在顶部切换语言为「中」即可查看中文效果。",
              )}
            </div>
          )}

          {importReport && (
            <ImportReport report={importReport} t={t} onDismiss={() => setImportReport(null)} />
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search english or chinese…", "搜索英文或中文…")}
                className="pl-8 h-9"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <FilterChip
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label={t(`All (${merged.length})`, `全部 (${merged.length})`)}
              />
              <FilterChip
                active={filter === "drafts"}
                onClick={() => setFilter("drafts")}
                label={t(`Drafts (${draftCount})`, `草稿 (${draftCount})`)}
              />
              <FilterChip
                active={filter === "published"}
                onClick={() => setFilter("published")}
                label={t(`Published (${publishedCount})`, `已发布 (${publishedCount})`)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[36%]">{t("English", "英文")}</TableHead>
                  <TableHead className="w-[26%]">{t("Current Chinese", "当前中文")}</TableHead>
                  <TableHead className="w-[26%]">{t("Draft Chinese", "草稿中文")}</TableHead>
                  <TableHead className="w-[12%]">{t("Status", "状态")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-slate-500 py-8">
                      {t("No strings match.", "没有匹配的字符串。")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 500).map((r) => <Row key={r.en} r={r} t={t} />)
                )}
                {filtered.length > 500 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-slate-400 py-3">
                      {t(
                        `Showing first 500 of ${filtered.length} — refine the search to see more.`,
                        `显示前 500 项,共 ${filtered.length} 项 — 请进一步搜索。`,
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Publish confirm */}
      <Dialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Publish translations?", "发布翻译?")}</DialogTitle>
            <DialogDescription>
              {t(
                `${draftCount} draft change${draftCount === 1 ? "" : "s"} will go live immediately for every user. This replaces the current published translations for those keys.`,
                `${draftCount} 项草稿更改将立即对所有用户生效,并替换这些键的当前已发布翻译。`,
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPublish(false)}>
              {t("Cancel", "取消")}
            </Button>
            <Button onClick={handlePublish} disabled={publishMut.isPending}>
              {publishMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("Publish", "发布")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard confirm */}
      <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Discard all drafts?", "丢弃所有草稿?")}</DialogTitle>
            <DialogDescription>
              {t(
                `All ${draftCount} unpublished change${draftCount === 1 ? "" : "s"} will be removed. Published translations are unaffected.`,
                `所有 ${draftCount} 项未发布的更改将被删除,已发布的翻译不受影响。`,
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDiscard(false)}>
              {t("Cancel", "取消")}
            </Button>
            <Button variant="destructive" onClick={handleDiscard} disabled={discardMut.isPending}>
              {discardMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("Discard", "丢弃")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 h-7 rounded-md text-xs font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function Row({ r, t }: { r: MergedRow; t: (en: string, zh: string) => string }) {
  const current = r.zhPublished ?? r.zhDefault;
  return (
    <TableRow>
      <TableCell className="align-top text-sm break-words whitespace-normal">
        {r.en}
      </TableCell>
      <TableCell className="align-top text-sm text-slate-700 break-words whitespace-normal">
        {current || <span className="text-slate-300">—</span>}
        {r.zhPublished != null && r.zhPublished !== r.zhDefault && (
          <Badge variant="outline" className="ml-2 text-[10px] border-emerald-300 text-emerald-700">
            {t("override", "覆盖")}
          </Badge>
        )}
      </TableCell>
      <TableCell className="align-top text-sm break-words whitespace-normal">
        {r.zhDraft != null ? (
          <span className="text-slate-900">{r.zhDraft}</span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </TableCell>
      <TableCell className="align-top">
        <StatusBadge status={r.status} t={t} />
      </TableCell>
    </TableRow>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: RowStatus;
  t: (en: string, zh: string) => string;
}) {
  if (status === "new-draft")
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500/90 text-white text-[10px]">
        {t("New", "新增")}
      </Badge>
    );
  if (status === "edit-draft")
    return (
      <Badge className="bg-blue-500 hover:bg-blue-500/90 text-white text-[10px]">
        {t("Edited", "已编辑")}
      </Badge>
    );
  if (status === "published-only")
    return (
      <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">
        {t("Published", "已发布")}
      </Badge>
    );
  return (
    <span className="text-[10px] text-slate-400">{t("Default", "默认")}</span>
  );
}

function ImportReport({
  report,
  t,
  onDismiss,
}: {
  report: { parsed: number; matched: number; unmatched: string[]; skippedSameAsBaseline: number };
  t: (en: string, zh: string) => string;
  onDismiss: () => void;
}) {
  const stagedCount = report.matched - report.skippedSameAsBaseline;
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs space-y-2">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-medium text-slate-900">
            {t(
              `Import complete: ${stagedCount} change${stagedCount === 1 ? "" : "s"} staged as draft${stagedCount === 1 ? "" : "s"}`,
              `导入完成:已暂存 ${stagedCount} 项草稿更改`,
            )}
          </div>
          <div className="text-slate-600 mt-1">
            {t(
              `Parsed ${report.parsed} rows · ${report.matched} matched catalog · ${report.skippedSameAsBaseline} match baseline · ${report.unmatched.length} unknown keys`,
              `解析 ${report.parsed} 行 · 匹配目录 ${report.matched} 项 · 与基线一致 ${report.skippedSameAsBaseline} 项 · 未知键 ${report.unmatched.length} 项`,
            )}
          </div>
          {report.unmatched.length > 0 && (
            <div className="mt-2 flex items-start gap-2 text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-medium">
                  {t(
                    "These English strings were not found in the catalog and were ignored:",
                    "以下英文字符串未在目录中找到,已被忽略:",
                  )}
                </div>
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {report.unmatched.slice(0, 10).map((k) => (
                    <li key={k} className="break-words">{k}</li>
                  ))}
                  {report.unmatched.length > 10 && (
                    <li className="text-slate-500">
                      …{t(`and ${report.unmatched.length - 10} more`, `还有 ${report.unmatched.length - 10} 项`)}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-700 text-xs"
        >
          {t("Dismiss", "关闭")}
        </button>
      </div>
    </div>
  );
}
