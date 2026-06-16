import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, ShieldCheck, Building2, Landmark } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { downloadCsv, fapiaoCsv, safeFilenamePart } from "./csvExport";

export type FapiaoData = {
  code: string;
  number: string;
  date: string;
  checkCode: string;
  taxAmount: number;
  taxableAmount: number;
  taxRate: number;
  net: number;
  weekLabel: string;
};

const BUYER = {
  nameZh: "马特·巴罗斯",
  nameEn: "Matt Barros",
  taxId: "91110108MA01ABCD7X",
  addressZh: "上海市静安区南京西路 1188 号 2204 室 · +86 138 0011 8826",
  addressEn: "1188 Nanjing W Rd, Apt 2204, Jing'an, Shanghai · +86 138 0011 8826",
  bank: "招商银行 上海分行 6225 8800 1234 5678",
};

const SELLER = {
  nameZh: "派维税务服务（深圳）有限公司",
  nameEn: "PayView Tax Services (Shenzhen) Co., Ltd.",
  taxId: "91440300MA5XYZ7K2P",
  addressZh: "深圳市福田区福华三路 28 号 鼎和大厦 31 层 · +86 755 8208 6688",
  addressEn: "31F Dinghe Bldg, 28 Fuhua 3rd Rd, Futian, Shenzhen · +86 755 8208 6688",
  bank: "中国工商银行 深圳分行 4000 1024 0900 5571 088",
};

const NUM_CN = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const UNIT_CN = ["", "拾", "佰", "仟"];
const BIG_UNIT_CN = ["", "万", "亿"];

function toCnAmount(amount: number): string {
  const fixed = amount.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  let intStr = "";
  const intRev = intPart.split("").reverse();
  let group = "";
  for (let i = 0; i < intRev.length; i++) {
    const d = parseInt(intRev[i], 10);
    const unit = UNIT_CN[i % 4];
    group = (d === 0 ? "零" : NUM_CN[d] + unit) + group;
    if (i % 4 === 3 && i < intRev.length - 1) {
      group = BIG_UNIT_CN[Math.floor((i + 1) / 4)] + group;
    }
  }
  intStr = group.replace(/零+/g, "零").replace(/零$/, "").replace(/零(万|亿)/g, "$1") || "零";
  intStr += "元";

  const jiao = parseInt(decPart[0], 10);
  const fen = parseInt(decPart[1], 10);
  let dec = "";
  if (jiao === 0 && fen === 0) dec = "整";
  else {
    if (jiao > 0) dec += NUM_CN[jiao] + "角";
    if (fen > 0) dec += NUM_CN[fen] + "分";
    if (fen === 0) dec += "整";
  }
  return intStr + dec;
}

export function FapiaoDialog({ open, onOpenChange, data }: { open: boolean; onOpenChange: (o: boolean) => void; data: FapiaoData }) {
  const { lang } = useLang();
  const cnAmount = toCnAmount(data.net);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogTitle className="sr-only">{lang === "zh" ? "增值税普通发票" : "VAT Invoice (Fapiao)"}</DialogTitle>

        <div className="bg-secondary/40 border-b border-border/60 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>{lang === "zh" ? "由派维税务代开 · 已完成代扣代缴" : "Issued by PayView Tax Services · Withholding completed"}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs"><Printer className="w-3.5 h-3.5" />{lang === "zh" ? "打印" : "Print"}</Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                const { headers, rows } = fapiaoCsv(data);
                downloadCsv(`fapiao-${safeFilenamePart(data.number)}.csv`, headers, rows);
              }}
            >
              <Download className="w-3.5 h-3.5" />{lang === "zh" ? "下载 CSV" : "Download CSV"}
            </Button>
            <Button size="sm" className="h-8 gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />{lang === "zh" ? "下载 PDF" : "Download PDF"}</Button>
          </div>
        </div>

        <div className="p-8 max-h-[80vh] overflow-y-auto bg-white">
          <div className="border-[3px] border-double border-rose-700/80 rounded-sm p-6 font-serif text-zinc-900 relative">

            <div className="absolute top-6 right-6 text-[11px] text-rose-700 leading-tight tabular-nums">
              <div>发票代码 <span className="font-mono ml-1">{data.code}</span></div>
              <div>发票号码 <span className="font-mono ml-1">{data.number}</span></div>
              <div>开票日期 <span className="ml-1">{data.date}</span></div>
              <div>校 验 码 <span className="font-mono ml-1">{data.checkCode}</span></div>
            </div>

            <div className="text-center mb-6">
              <div className="text-xs text-rose-700 tracking-[0.4em] mb-1">SHENZHEN VAT INVOICE · 全国统一</div>
              <h1 className="text-2xl font-bold tracking-[0.3em] text-rose-700">深圳增值税普通发票</h1>
              <p className="text-[10px] text-zinc-500 mt-1">No.{data.number} · 派维税务服务（深圳）有限公司 代开</p>
            </div>

            <table className="w-full border-collapse text-[11px] mb-0">
              <tbody>
                <tr>
                  <td className="border border-zinc-700 align-top w-8 text-center text-zinc-700 [writing-mode:vertical-rl] py-3 bg-rose-50/30">购<br />买<br />方</td>
                  <td className="border border-zinc-700 p-2 w-1/2">
                    <Row k="名 称" v={`${BUYER.nameZh}（${BUYER.nameEn}）`} />
                    <Row k="纳税人识别号" v={BUYER.taxId} mono />
                    <Row k="地址、电话" v={BUYER.addressZh} />
                    <Row k="开户行及账号" v={BUYER.bank} mono />
                  </td>
                  <td className="border border-zinc-700 p-2 align-top">
                    <div className="text-[10px] text-zinc-500 mb-1">密码区</div>
                    <pre className="font-mono text-[10px] leading-snug tracking-tight text-zinc-700 select-none">
{`<7+/0249-58162*04827>
+/0249-58162*0482739
0249-58162*04827390/
9-58162*04827390/24+`}
                    </pre>
                  </td>
                </tr>

                <tr>
                  <th className="border border-zinc-700 bg-rose-50/40 py-1.5 px-2 text-left font-semibold text-[11px]">货物或应税劳务、服务名称</th>
                  <th className="border border-zinc-700 bg-rose-50/40 py-1.5 px-2 text-right font-semibold text-[11px]">金额</th>
                  <th className="border border-zinc-700 bg-rose-50/40 py-1.5 px-2 text-center font-semibold text-[11px] w-16">税率</th>
                  <th className="border border-zinc-700 bg-rose-50/40 py-1.5 px-2 text-right font-semibold text-[11px] w-24">税额</th>
                </tr>
                <tr>
                  <td className="border border-zinc-700 p-2 align-top">
                    <div>*经纪代理服务* 推广服务佣金</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">More Health 合作伙伴佣金 · {data.weekLabel}</div>
                  </td>
                  <td className="border border-zinc-700 p-2 text-right tabular-nums">¥{data.taxableAmount.toFixed(2)}</td>
                  <td className="border border-zinc-700 p-2 text-center tabular-nums">{(data.taxRate * 100).toFixed(0)}%</td>
                  <td className="border border-zinc-700 p-2 text-right tabular-nums">¥{data.taxAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-700 p-2 text-right font-semibold">合 计</td>
                  <td className="border border-zinc-700 p-2 text-right tabular-nums font-semibold">¥{data.taxableAmount.toFixed(2)}</td>
                  <td className="border border-zinc-700 p-2"></td>
                  <td className="border border-zinc-700 p-2 text-right tabular-nums font-semibold">¥{data.taxAmount.toFixed(2)}</td>
                </tr>

                <tr>
                  <td className="border border-zinc-700 p-2 text-zinc-700" colSpan={2}>
                    <span className="text-[10px] text-zinc-500 mr-2">价税合计（大写）</span>
                    <span className="font-semibold tracking-wider">⊗ {cnAmount}</span>
                  </td>
                  <td className="border border-zinc-700 p-2 text-right text-zinc-700" colSpan={2}>
                    <span className="text-[10px] text-zinc-500 mr-2">（小写）</span>
                    <span className="font-bold tabular-nums text-base">¥{data.net.toFixed(2)}</span>
                  </td>
                </tr>

                <tr>
                  <td className="border border-zinc-700 align-top w-8 text-center text-zinc-700 [writing-mode:vertical-rl] py-3 bg-rose-50/30">销<br />售<br />方</td>
                  <td className="border border-zinc-700 p-2" colSpan={1}>
                    <Row k="名 称" v={`${SELLER.nameZh}`} />
                    <Row k="纳税人识别号" v={SELLER.taxId} mono />
                    <Row k="地址、电话" v={SELLER.addressZh} />
                    <Row k="开户行及账号" v={SELLER.bank} mono />
                  </td>
                  <td className="border border-zinc-700 p-2 align-middle relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full border-[2.5px] border-rose-700 flex items-center justify-center rotate-[-12deg] opacity-90">
                        <div className="text-rose-700 text-center leading-tight">
                          <div className="text-[9px] tracking-widest">派维税务服务</div>
                          <div className="text-[9px] tracking-widest">（深圳）有限公司</div>
                          <div className="text-2xl my-0.5">★</div>
                          <div className="text-[8px] tracking-[0.2em] font-semibold">发票专用章</div>
                          <div className="text-[7px] mt-0.5 font-mono">{SELLER.taxId.slice(-10)}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr className="text-[10px]">
                  <td className="border border-zinc-700 p-2 text-center text-zinc-500" colSpan={1}>备注</td>
                  <td className="border border-zinc-700 p-2 align-top" colSpan={3}>
                    <div className="space-y-1 text-[10px] leading-relaxed">
                      <div>• 本笔款项由 <span className="font-semibold">派维（PayView）</span> 作为代付服务方，依据《合作伙伴佣金协议》代More Health统一发放。</div>
                      <div>• 已按照中华人民共和国个人所得税法 (经营所得 6%) 完成 <span className="font-semibold">代扣代缴</span>，缴款凭证编号 PV-WT-{data.number}。</div>
                      <div>• 资金通过 <span className="font-semibold">中国工商银行 (ICBC)</span> 跨行清算，划付至收款方招商银行账户。</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-3 mt-3 text-[10px] text-zinc-600">
              <div>收款人：王 思 远</div>
              <div>复 核：陈 宇 涵</div>
              <div>开票人：李 雨 桐</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Trail icon={<Building2 className="w-4 h-4" />} label={lang === "zh" ? "代付方" : "Payer"} title="PayView" sub={lang === "zh" ? "派维税务 · 已扣税" : "PayView Tax · Withheld"} />
            <Trail icon={<Landmark className="w-4 h-4" />} label={lang === "zh" ? "清算银行" : "Settlement Bank"} title="ICBC 工商银行" sub={lang === "zh" ? "跨行划付 · T+0" : "Interbank · T+0"} />
            <Trail icon={<ShieldCheck className="w-4 h-4" />} label={lang === "zh" ? "税务校验" : "Tax Verification"} title="国家税务总局" sub={lang === "zh" ? "可联网核验" : "Online verifiable"} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex gap-2 py-0.5 text-[11px] leading-snug">
      <span className="text-zinc-500 w-20 shrink-0">{k}</span>
      <span className={`flex-1 ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}

function Trail({ icon, label, title, sub }: { icon: React.ReactNode; label: string; title: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-card border border-border/50 flex items-center justify-center text-primary">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className="text-sm font-semibold text-foreground truncate">{title}</div>
        <div className="text-[11px] text-muted-foreground truncate">{sub}</div>
      </div>
    </div>
  );
}
