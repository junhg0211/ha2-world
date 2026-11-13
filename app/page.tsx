"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Axe, ChevronDown, CircleDot, Construction, Crosshair, Leaf, LockKeyhole,
  MessageCircle, Minus, MoveRight, Package, Plus, Radio, Send, Shield,
  Swords, Wheat,
} from "lucide-react";

type FeedItem = {
  id: number;
  icon: "move" | "rp" | "combat" | "world";
  title: string;
  detail: string;
  time: string;
};

type StoredCharacter = {
  name: string; gender: "male" | "female"; hp: number; hpMax: number; position: number;
  raw: number; food: number; clothing: number; muScissors: number; muRock: number; muPaper: number;
};
type WorldState = { characters: Array<{ id: string; name: string; gender: string; position: number; hp: number; hpMax: number }>; facilities: Array<{ id: string; position: number; hp: number; hpMax: number; joo: number; completedPercent: number; rawCommitted: number; passwordHash: string | null; rawStored: number; foodStored: number }>; crops: Array<{ id: string; position: number; harvestAt: string; harvestedAt: string | null }>; drops: Array<{ id: string; position: number; raw: number; food: number }>; pendingAttacks: Array<{ id: string; attackerCharacterId: string; expiresAt: string }>; birthSessions: Array<{ id: string; proposedName: string | null; motherApproved: boolean; fatherApproved: boolean }>; };

const iconFor = { move: MoveRight, rp: MessageCircle, combat: Swords, world: Leaf };
const facilities = [
  { name: "갈대 창고", hp: 760, maxHp: 1000, joo: 12, locked: true },
  { name: "서쪽 관문", hp: 980, maxHp: 1000, joo: 5, locked: true },
  { name: "바람 쉼터", hp: 410, maxHp: 1000, joo: 0, locked: false },
];

export default function Home() {
  const [activePanel, setActivePanel] = useState<"rp" | "action" | "combat">("rp");
  const [hp, setHp] = useState(74);
  const [position, setPosition] = useState(128.4);
  const [raw, setRaw] = useState(18);
  const [food, setFood] = useState(11);
  const [clothes, setClothes] = useState(8);
  const [mu, setMu] = useState({ scissors: 4, rock: 3, paper: 5 });
  const [rpText, setRpText] = useState("");
  const [strength, setStrength] = useState(65);
  const [hand, setHand] = useState<"가위" | "바위" | "보">("가위");
  const [notice, setNotice] = useState("Discord 웹훅 연결 대기 중");
  const [sending, setSending] = useState(false);
  const [characterName, setCharacterName] = useState("윤하");
  const [characterGender, setCharacterGender] = useState<"male" | "female">("female");
  const [connected, setConnected] = useState(false);
  const [world, setWorld] = useState<WorldState | null>(null);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [password, setPassword] = useState("");
  const [birthName, setBirthName] = useState("");
  const [feed, setFeed] = useState<FeedItem[]>([
    { id: 1, icon: "world", title: "재배가 자라고 있습니다", detail: "좌표 127.8 · 수확까지 17시간 42분", time: "방금" },
    { id: 2, icon: "move", title: "현재 조종 캐릭터를 선택했습니다", detail: "윤하 · 실제 계정 정보는 공개되지 않습니다", time: "6분 전" },
    { id: 3, icon: "world", title: "창고가 열렸습니다", detail: "인근 시설 · 마지막 상호작용 뒤 10초에 닫힙니다", time: "18분 전" },
  ]);

  const defense = useMemo(() => Math.round((1 - 1.02 ** -clothes) * 100), [clothes]);
  const currentMu = hand === "가위" ? mu.scissors : hand === "바위" ? mu.rock : mu.paper;
  const estimatedDamage = ((currentMu * strength) / 100) * (hp / 100);

  function adoptCharacter(character: StoredCharacter) {
    setCharacterName(character.name); setCharacterGender(character.gender);
    setHp(Math.round(character.hp)); setPosition(character.position); setRaw(character.raw); setFood(character.food);
    setClothes(character.clothing); setMu({ scissors: character.muScissors, rock: character.muRock, paper: character.muPaper });
    setConnected(true);
  }

  useEffect(() => {
    fetch("/api/me").then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.character) { adoptCharacter(data.character); setWorld(data.world ?? null); setSelectedTarget(data.world?.characters?.[0]?.id ?? ""); setNotice("D1 세계 상태와 동기화됨"); }
      else if (data?.player) setNotice("조종 캐릭터 배정을 기다리고 있습니다. 운영 콘솔에서 초기 생명을 배정하세요.");
    }).catch(() => undefined);
  }, []);

  function addFeed(icon: FeedItem["icon"], title: string, detail: string) {
    setFeed((items) => [{ id: Date.now(), icon, title, detail, time: "방금" }, ...items].slice(0, 6));
  }
  async function publishDiscord(event: string, detail: string) {
    setSending(true);
    try {
      const response = await fetch("/api/discord/webhook", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ characterName: "윤하", event, detail }),
      });
      const result = (await response.json()) as { delivered?: boolean; message?: string };
      setNotice(result.delivered ? "Discord에 캐릭터 이름으로 전송됨" : result.message ?? "활동을 기록했습니다");
    } catch { setNotice("웹훅에 연결하지 못했습니다. 활동은 이 화면에만 기록됩니다."); }
    finally { setSending(false); }
  }
  async function action(label: string, detail: string, icon: FeedItem["icon"] = "world") {
    addFeed(icon, label, detail); await publishDiscord(label, detail);
  }
  async function persistentAction(payload: Record<string, unknown>, label: string, detail: string, icon: FeedItem["icon"] = "world") {
    setSending(true);
    try {
      const response = await fetch("/api/game/action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { character?: StoredCharacter; error?: string };
      if (!response.ok || !result.character) { setNotice(result.error ?? "행동을 처리하지 못했습니다."); return false; }
      adoptCharacter(result.character); addFeed(icon, label, detail); setNotice("D1 상태와 Discord 웹훅에 기록되었습니다."); return true;
    } catch { setNotice("세계 상태 서버에 연결하지 못했습니다."); return false; }
    finally { setSending(false); }
  }
  async function submitRp(event: FormEvent) {
    event.preventDefault(); const content = rpText.trim(); if (!content) return;
    if (await persistentAction({ kind: "say", text: content }, `${characterName}가 RP 메시지를 보냈습니다`, content, "rp")) setRpText("");
  }
  async function plantRaw() {
    if (raw < 1) return setNotice("심을 재가 부족합니다.");
    await persistentAction({ kind: "plant_raw" }, "재를 심었습니다", `좌표 ${position.toFixed(1)} · 24시간 뒤 재 2~4개를 수확할 수 있습니다.`);
  }
  async function craftFood() {
    if (raw < 1) return setNotice("식 제작에는 재 1개가 필요합니다.");
    await persistentAction({ kind: "craft_food" }, "식을 제작했습니다", "재 1개를 소비해 식 1개를 만들었습니다.");
  }
  async function eatFood() {
    if (food < 1 || hp >= 100) return setNotice(hp >= 100 ? "체력이 가득 찼습니다." : "먹을 식이 없습니다.");
    await persistentAction({ kind: "eat_food" }, "식을 섭취했습니다", "체력이 1 회복되었습니다.");
  }
  async function raiseStat(stat: "의" | "가위" | "바위" | "보") {
    if (food < 20) return setNotice("강화에는 식 20개가 필요합니다.");
    const serverStat = stat === "의" ? "clothing" : stat === "가위" ? "scissors" : stat === "바위" ? "rock" : "paper";
    await persistentAction({ kind: "upgrade", stat: serverStat }, `${stat} 수치를 올렸습니다`, `식 20개를 소비해 ${stat}을 1 올렸습니다.`);
  }
  async function move(delta: number) {
    const next = ((position + delta) % 360 + 360) % 360;
    await persistentAction({ kind: "move", delta }, "이동했습니다", `${characterName}가 좌표 ${next.toFixed(1)}로 이동했습니다.`, "move");
  }
  async function attack() {
    if (!selectedTarget) return setNotice("상호작용 범위 안의 캐릭터가 없습니다.");
    await persistentAction({ kind: "attack_character", targetId: selectedTarget, hand: hand === "가위" ? "scissors" : hand === "바위" ? "rock" : "paper", strength }, "공격 세션을 시작했습니다", "공격 수단과 강도는 수비자에게 비공개입니다.", "combat");
  }
  async function worldAction(payload: Record<string, unknown>, label: string) { await persistentAction(payload, label, "세계 상태에 반영되었습니다."); const data = await fetch("/api/me").then((r) => r.ok ? r.json() : null).catch(() => null); if (data?.world) setWorld(data.world); }

  return <main className="min-h-screen bg-[#0e1617] text-[#e9e4d5]">
    <div className="noise" aria-hidden="true" />
    <header className="relative z-10 border-b border-white/10 bg-[#0e1617]/95 px-5 py-4 backdrop-blur md:px-10">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full border border-[#b9a26d]/60 bg-[#b9a26d]/10 text-[#e1c981]"><CircleDot size={20} /></div><div><p className="font-serif text-lg leading-none tracking-[0.16em] text-[#f4edda]">LIVING RING</p><p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#8c9a8d]">Character-first roleplay world</p></div></div>
        <div className="hidden items-center gap-2 text-xs text-[#a8b2a7] lg:flex"><Radio size={14} className="text-[#83bf9a]" /><span>세계 시간은 흐르고 있습니다</span></div>
        <div className="flex items-center gap-2"><a href="/operator" className="hidden rounded-full border border-white/10 px-3 py-2 text-xs text-[#b9c1b5] transition hover:border-[#c6b581]/40 md:block">운영 콘솔</a><button className="flex items-center gap-2 rounded-full border border-[#c6b581]/35 bg-[#c6b581]/10 px-3 py-2 text-sm text-[#f0dfab]"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#dbc481] text-[11px] font-bold text-[#26302c]">{characterName.slice(0, 1)}</span>{characterName} <ChevronDown size={14} /></button></div>
      </div>
    </header>

    <div className="relative z-10 mx-auto grid max-w-[1500px] gap-5 px-5 py-5 lg:grid-cols-[260px_minmax(0,1fr)_330px] lg:px-10 lg:py-8">
      <aside className="order-2 rounded-2xl border border-white/10 bg-[#152021]/75 p-4 shadow-2xl shadow-black/20 lg:order-1">
        <p className="label">현재 조종 캐릭터</p>
        <div className="mt-3 rounded-xl border border-[#c6b581]/20 bg-gradient-to-br from-[#26322f] to-[#182524] p-4"><div className="flex items-start justify-between"><div><h1 className="font-serif text-3xl text-[#f2e9d3]">{characterName}</h1><p className="mt-1 text-sm text-[#a7b2a6]">{characterGender === "female" ? "여성" : "남성"} · {connected ? "D1 세계와 동기화됨" : "초기 생명 배정 대기"}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${connected ? "bg-[#7ba788]/15 text-[#9cd6ae]" : "bg-[#d8bb7a]/15 text-[#e4c983]"}`}>{connected ? "ALIVE" : "WAITING"}</span></div><div className="mt-5 space-y-3"><Meter label="체력" value={hp} suffix="/ 100" color="rose" /><Meter label="허기" value={hp} suffix="%" color="amber" /></div></div>
        <div className="mt-5"><p className="label">보유 자원</p><div className="mt-2 grid grid-cols-2 gap-2"><Resource icon={<Leaf size={17} />} label="재" value={raw} tone="green" /><Resource icon={<Wheat size={17} />} label="식" value={food} tone="gold" /><Resource icon={<Shield size={17} />} label="의" value={clothes} tone="slate" /><Resource icon={<Swords size={17} />} label="무" value={`${mu.scissors}/${mu.rock}/${mu.paper}`} tone="red" /></div></div>
        <div className="mt-5 border-t border-white/10 pt-5"><p className="label">빠른 행동</p><div className="mt-2 grid grid-cols-2 gap-2"><QuickButton icon={<Wheat size={15} />} label="식 섭취" onClick={eatFood} /><QuickButton icon={<Leaf size={15} />} label="재 심기" onClick={plantRaw} /><QuickButton icon={<Axe size={15} />} label="식 제작" onClick={craftFood} /><QuickButton icon={<Construction size={15} />} label="시설 건설" onClick={() => action("시설 건설을 준비했습니다", `좌표 ${position.toFixed(1)} · 재 100개, 유효 시간 1시간이 필요합니다.`)} /></div></div>
      </aside>

      <section className="order-1 min-w-0 lg:order-2">
        <div className="map-shell relative min-h-[440px] overflow-hidden rounded-2xl border border-white/10 bg-[#1b2927] p-5 shadow-2xl shadow-black/25 md:p-8"><div className="absolute inset-0 map-grid opacity-70" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3"><div><p className="label">환형 지도 · 공개 시야 6.0</p><h2 className="mt-1 font-serif text-3xl text-[#f0eadb]">갈대 평원</h2><p className="mt-2 text-sm text-[#a6b2aa]">상호작용 범위는 현재 좌표에서 좌우 0.5입니다.</p></div><div className="rounded-xl border border-white/10 bg-[#10201e]/70 px-3 py-2 text-right"><p className="text-[10px] uppercase tracking-[0.16em] text-[#8b9b92]">현재 좌표</p><p className="font-mono text-xl text-[#ebd895]">{position.toFixed(1)}</p></div></div>
          <div className="relative mt-14 h-40"><div className="absolute left-0 right-0 top-1/2 h-px bg-[#d4c385]/30" /><div className="absolute left-0 right-0 top-1/2 h-16 -translate-y-1/2 rounded-full border border-[#d4c385]/10 bg-[#0d1716]/25" />
            {facilities.map((facility, index) => <div key={facility.name} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${22 + index * 27}%` }}><div className="group relative"><div className={`grid h-12 w-12 place-items-center rounded-full border ${facility.locked ? "border-[#c9b36d]/70 bg-[#c9b36d]/15 text-[#e6cf85]" : "border-[#77ad93]/70 bg-[#77ad93]/15 text-[#9fd5b4]"}`}>{facility.locked ? <LockKeyhole size={18} /> : <Package size={18} />}</div><div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-36 -translate-x-1/2 rounded-lg border border-white/10 bg-[#101918]/95 p-2 text-center opacity-0 shadow-xl transition group-hover:opacity-100"><p className="text-xs font-medium text-[#eee4c8]">{facility.name}</p><p className="mt-1 text-[10px] text-[#99a69d]">체력 {facility.hp}/{facility.maxHp} · 주 {facility.joo}</p></div></div></div>)}
            <div className="absolute left-[54%] top-1/2 -translate-x-1/2 -translate-y-1/2"><div className="pulse-ring absolute inset-0 rounded-full bg-[#e0c976]/25" /><div className="relative grid h-14 w-14 place-items-center rounded-full border-2 border-[#f1d979] bg-[#e2cc77] text-[#17211e] shadow-[0_0_28px_rgba(226,204,119,.45)]"><span className="font-serif text-xl">{characterName.slice(0, 1)}</span></div><p className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-[#f5e8b8]">{characterName}</p></div>
            <div className="absolute left-[39%] top-[24%] grid h-8 w-8 place-items-center rounded-full border border-[#6ea97d]/60 bg-[#6ea97d]/15 text-[#9acd9f]"><Leaf size={14} /></div>
          </div>
          <div className="relative mt-10 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0f1918]/75 p-3"><button className="map-button" onClick={() => move(-0.1)}><Minus size={16} /> 왼쪽</button><span className="text-center text-xs text-[#97a59d]">한 바퀴 1시간 · 벽은 통과를 제한하지만 시야는 막지 않습니다</span><button className="map-button" onClick={() => move(0.1)}>오른쪽 <Plus size={16} /></button></div>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#152021]/75 p-4 md:p-5"><div className="flex gap-2 border-b border-white/10 pb-3"><Tab active={activePanel === "rp"} onClick={() => setActivePanel("rp")} icon={<MessageCircle size={15} />} label="RP 발언" /><Tab active={activePanel === "action"} onClick={() => setActivePanel("action")} icon={<Axe size={15} />} label="성장·제작" /><Tab active={activePanel === "combat"} onClick={() => setActivePanel("combat")} icon={<Crosshair size={15} />} label="공격" /></div>
          {activePanel === "rp" && <form className="mt-4" onSubmit={submitRp}><label className="label" htmlFor="rp-message">Discord RP 채널로 보내기</label><textarea id="rp-message" value={rpText} onChange={(event) => setRpText(event.target.value)} placeholder={`${characterName}의 목소리로 세계에 남길 말을 적어주세요.`} className="mt-2 min-h-28 w-full resize-none rounded-xl border border-white/10 bg-[#0c1514] p-3 text-sm text-[#f2ead7] outline-none transition placeholder:text-[#62716a] focus:border-[#c7b477]/60" /><div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-[#89968e]">실제 Discord 계정은 노출되지 않고, <strong className="font-medium text-[#d9ca98]">{characterName}</strong> 이름의 웹훅으로 게시됩니다.</p><button disabled={sending} className="primary-button" type="submit"><Send size={15} /> 전송</button></div></form>}
          {activePanel === "action" && <div className="mt-4 grid gap-3 md:grid-cols-2"><ActionCard title="의 강화" value={`Lv. ${clothes} · 피해 감소 ${defense}%`} cost="식 20" onClick={() => raiseStat("의")} /><ActionCard title="무 강화" value={`가위 ${mu.scissors} · 바위 ${mu.rock} · 보 ${mu.paper}`} cost="식 20" onClick={() => raiseStat(hand)} /><ActionCard title="주 강화" value="인근 완성 시설에서만 가능" cost="재 20" onClick={() => action("시설 주 강화 안내", "주 강화는 완성된 시설 상호작용 범위 안에서만 할 수 있습니다.")} /><ActionCard title="시설 수리" value="재 1 가치 = 체력 1" cost="재" onClick={() => action("시설 수리를 준비했습니다", "인근 시설에 재를 투입해 체력을 회복할 수 있습니다.")} /></div>}
          {activePanel === "combat" && <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.1fr]"><div className="rounded-xl border border-[#e0a99b]/20 bg-[#2a1b1b]/45 p-4"><p className="label text-[#dba89b]">공격 대상</p><select value={selectedTarget} onChange={(e) => setSelectedTarget(e.target.value)} className="field mt-3 w-full">{world?.characters?.length ? world.characters.map((target) => <option key={target.id} value={target.id}>{target.name} · 체력 {Math.round(target.hp)} · 좌표 {target.position.toFixed(1)}</option>) : <option value="">범위 안에 캐릭터가 없습니다</option>}</select><p className="mt-4 text-xs leading-5 text-[#b89a92]">공격자와 강도는 수비자에게만 알립니다. 대응 전까지 대상은 이동·수동 아이템 사용이 제한됩니다.</p></div><div className="rounded-xl border border-white/10 bg-[#0d1716] p-4"><div className="flex items-center justify-between"><p className="label">공격 설정</p><span className="font-mono text-xs text-[#d6c27d]">예상 기본 피해 {estimatedDamage.toFixed(2)}</span></div><div className="mt-3 grid grid-cols-3 gap-2">{(["가위", "바위", "보"] as const).map((option) => <button key={option} onClick={() => setHand(option)} className={`rounded-lg border px-3 py-2 text-sm transition ${hand === option ? "border-[#d8be70] bg-[#d8be70]/15 text-[#f3dc96]" : "border-white/10 text-[#9eaaa2] hover:bg-white/5"}`}>{option}</button>)}</div><div className="mt-4 flex items-center gap-3"><input aria-label="공격 강도" type="range" min="0" max="100" value={strength} onChange={(event) => setStrength(Number(event.target.value))} className="accent-[#d8be70]" /><span className="w-12 font-mono text-sm text-[#ead795]">{strength}%</span><button className="primary-button ml-auto" onClick={attack}><Swords size={15} /> 공격</button></div></div></div>}
        </div>
      </section>

      <aside className="order-3 space-y-5"><div className="rounded-2xl border border-[#c4b070]/20 bg-[#1b2421]/90 p-4"><div className="flex items-center justify-between"><div><p className="label">세계 상호작용</p><h2 className="mt-1 font-serif text-xl text-[#f1e8d2]">주변 상태</h2></div><Radio size={18} className="text-[#83bf9a]" /></div><div className="mt-3 space-y-2 text-xs text-[#b9c4ba]">{world?.pendingAttacks?.map((a) => <div key={a.id} className="rounded-lg border border-[#de958c]/30 p-2">공격 대응 필요 <div className="mt-2 grid grid-cols-3 gap-1">{(["scissors","rock","paper"] as const).map((h) => <button key={h} className="map-button" onClick={() => worldAction({ kind: "defend", attackId: a.id, hand: h }, "공격에 대응했습니다")}>{h === "scissors" ? "가위" : h === "rock" ? "바위" : "보"}</button>)}</div></div>)}{world?.crops?.filter((crop) => !crop.harvestedAt && new Date(crop.harvestAt) <= new Date()).map((crop) => <button className="map-button w-full" key={crop.id} onClick={() => worldAction({ kind: "harvest", cropId: crop.id }, "재를 수확했습니다")}>수확 가능 · 좌표 {crop.position.toFixed(1)}</button>)}{world?.drops?.map((drop) => <button className="map-button w-full" key={drop.id} onClick={() => worldAction({ kind: "collect_drop", dropId: drop.id }, "유산을 주웠습니다")}>드롭 · 재 {drop.raw} / 식 {drop.food}</button>)}<input value={password} onChange={(e) => setPassword(e.target.value)} className="field" placeholder="시설 비밀번호 · 선택" />{world?.facilities?.map((facility) => <div key={facility.id} className="rounded-lg border border-white/10 p-2"><p>시설 {facility.position.toFixed(1)} · {Math.round(facility.completedPercent * 100)}% · 체력 {Math.round(facility.hp)}</p><div className="mt-2 grid grid-cols-2 gap-1"><button className="map-button" onClick={() => worldAction({ kind: "build_facility", position: facility.position, password }, "시설 건설을 진행했습니다")}>건설 진행</button><button className="map-button" onClick={() => worldAction({ kind: "facility_access", facilityId: facility.id, password }, "시설을 열었습니다")}>열기</button><button className="map-button" onClick={() => worldAction({ kind: "repair_facility", facilityId: facility.id, raw: 1 }, "시설을 수리했습니다")}>수리 +1</button><button className="map-button" onClick={() => worldAction({ kind: "upgrade_joo", facilityId: facility.id }, "주를 강화했습니다")}>주 강화</button></div></div>)}</div><button className="map-button mt-3 w-full" onClick={() => worldAction({ kind: "build_facility", position, password }, "시설 건설을 시작했습니다")}>현재 좌표에 시설 건설 시작</button><button className="map-button mt-2 w-full" onClick={() => worldAction({ kind: "queue", join: true }, "출산 대기열에 등록했습니다")}>출산 대기열 등록</button><div className="mt-4 rounded-lg border border-white/10 bg-[#0d1514] px-3 py-2 text-xs text-[#c8c2ac]">{notice}</div></div><div className="rounded-2xl border border-white/10 bg-[#152021]/75 p-4"><div className="flex items-center justify-between"><p className="label">내 활동</p><button className="text-xs text-[#cbb675]" onClick={() => setFeed([])}>비우기</button></div><ol className="mt-4 space-y-4">{feed.length === 0 && <li className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-[#849189]">아직 기록된 활동이 없습니다.</li>}{feed.map((item) => { const Icon = iconFor[item.icon]; return <li key={item.id} className="flex gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-[#d5c07c]"><Icon size={15} /></div><div className="min-w-0"><p className="text-sm text-[#e7e0cc]">{item.title}</p><p className="mt-1 text-xs leading-5 text-[#88968d]">{item.detail}</p><p className="mt-1 text-[10px] text-[#65736a]">{item.time}</p></div></li>; })}</ol></div></aside>
    </div>
  </main>;
}

function Meter({ label, value, suffix, color }: { label: string; value: number; suffix: string; color: "rose" | "amber" }) { const colors = color === "rose" ? "from-[#df8079] to-[#ca9b75]" : "from-[#d9c174] to-[#b9a15b]"; return <div><div className="mb-1 flex items-center justify-between text-xs"><span className="text-[#b8c2b7]">{label}</span><span className="font-mono text-[#e8dbc0]">{value}{suffix}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-gradient-to-r ${colors}`} style={{ width: `${value}%` }} /></div></div>; }
function Resource({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: "green" | "gold" | "slate" | "red" }) { const tones = { green: "text-[#8bbf98] bg-[#8bbf98]/10", gold: "text-[#d9be72] bg-[#d9be72]/10", slate: "text-[#aab8bd] bg-[#aab8bd]/10", red: "text-[#de958c] bg-[#de958c]/10" }; return <div className="rounded-lg border border-white/8 bg-[#0d1716]/60 p-2.5"><div className={`grid h-7 w-7 place-items-center rounded-md ${tones[tone]}`}>{icon}</div><p className="mt-2 text-[10px] text-[#92a097]">{label}</p><p className="font-mono text-sm text-[#eee6d4]">{value}</p></div>; }
function QuickButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick} className="flex items-center gap-2 rounded-lg border border-white/8 bg-[#101a19] px-2.5 py-2 text-left text-xs text-[#c8d0c8] transition hover:border-[#cfba75]/40 hover:bg-[#c5b171]/10">{icon}<span>{label}</span></button>; }
function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button onClick={onClick} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-[#d5bf78]/15 text-[#ecd892]" : "text-[#8f9c94] hover:bg-white/5"}`}>{icon}{label}</button>; }
function ActionCard({ title, value, cost, onClick }: { title: string; value: string; cost: string; onClick: () => void }) { return <button onClick={onClick} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0d1716] p-4 text-left transition hover:border-[#d5bd72]/35 hover:bg-[#171f1d]"><div><p className="font-medium text-[#e9e1cf]">{title}</p><p className="mt-1 text-xs text-[#89968e]">{value}</p></div><span className="rounded-md bg-[#d5bd72]/10 px-2 py-1 text-xs text-[#d9c37e]">{cost}</span></button>; }
