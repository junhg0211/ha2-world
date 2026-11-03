"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck, Sparkles } from "lucide-react";

export default function OperatorPage() {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [position, setPosition] = useState("0");
  const [raw, setRaw] = useState("0");
  const [food, setFood] = useState("0");
  const [clothing, setClothing] = useState("0");
  const [discordUserId, setDiscordUserId] = useState("");
  const [status, setStatus] = useState("운영자 키를 입력하면 현재 로그인한 사용자에게 생명을 배정할 수 있습니다.");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      const response = await fetch("/api/admin/characters", {
        method: "POST",
        headers: { "content-type": "application/json", "x-ha2-admin-key": key },
        body: JSON.stringify({ name, gender, position: Number(position), raw: Number(raw), food: Number(food), clothing: Number(clothing), discordUserId: discordUserId || undefined }),
      });
      const result = await response.json() as { character?: { name: string }; error?: string };
      setStatus(response.ok ? `${result.character?.name}의 조종권을 배정했습니다. 대시보드를 새로고침하면 동기화됩니다.` : result.error ?? "배정에 실패했습니다.");
    } catch { setStatus("서버에 연결하지 못했습니다."); }
    finally { setSending(false); }
  }

  return <main className="min-h-screen bg-[#0e1617] px-5 py-10 text-[#e9e4d5] md:px-10">
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#b9c6bb] hover:text-[#e5d19a]"><ArrowLeft size={16} /> 세계 대시보드로 돌아가기</Link>
      <div className="mt-8 rounded-3xl border border-[#c5b071]/25 bg-[#152021] p-6 shadow-2xl shadow-black/30 md:p-9">
        <div className="flex items-start gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d5bd72]/15 text-[#dfc980]"><ShieldCheck size={23} /></div><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#9bac9f]">Operator Console</p><h1 className="mt-1 font-serif text-3xl text-[#f2e9d8]">초기 생명 배정</h1><p className="mt-2 text-sm leading-6 text-[#a9b4aa]">이 화면은 사이트에 로그인한 운영자 자신에게 캐릭터 조종권을 부여합니다. 다른 사용자를 배정할 때는 관리 API를 사용하세요.</p></div></div>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block"><span className="label">운영자 키</span><div className="relative mt-2"><KeyRound className="absolute left-3 top-3 text-[#bba86e]" size={17} /><input required type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ADMIN_API_KEY" className="w-full rounded-xl border border-white/10 bg-[#0c1514] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#d5bd72]/70" /></div></label>
          <div className="grid gap-4 md:grid-cols-2"><label className="block"><span className="label">캐릭터 이름</span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="윤하" className="field mt-2" /></label><label className="block"><span className="label">성별</span><select value={gender} onChange={(e) => setGender(e.target.value as "female" | "male")} className="field mt-2"><option value="female">여성</option><option value="male">남성</option></select></label></div>
          <div className="grid gap-4 sm:grid-cols-3"><NumberField label="초기 좌표" value={position} setValue={setPosition} /><NumberField label="초기 재" value={raw} setValue={setRaw} /><NumberField label="초기 식" value={food} setValue={setFood} /></div>
          <div className="grid gap-4 md:grid-cols-2"><NumberField label="초기 의" value={clothing} setValue={setClothing} /><label className="block"><span className="label">Discord 사용자 ID · 선택</span><input value={discordUserId} onChange={(e) => setDiscordUserId(e.target.value)} placeholder="Discord 명령 연결용" className="field mt-2" /></label></div>
          <p className="rounded-xl border border-[#d5bd72]/15 bg-[#d5bd72]/8 p-3 text-xs leading-5 text-[#c8c5b7]"><Sparkles className="mr-1 inline text-[#e1c87c]" size={14} /> 배정 뒤 캐릭터는 체력 100, 무 가위/바위/보 각 1, 100일 자연사 규칙으로 생성됩니다.</p>
          <button disabled={sending} className="primary-button w-full justify-center py-3" type="submit">{sending ? "배정 중…" : "생명 조종권 배정"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-[#b8c4b9]" aria-live="polite">{status}</p>
      </div>
    </div>
  </main>;
}

function NumberField({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) {
  return <label className="block"><span className="label">{label}</span><input min="0" type="number" value={value} onChange={(e) => setValue(e.target.value)} className="field mt-2" /></label>;
}
