const token = process.env.DISCORD_BOT_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !applicationId || !guildId) {
  throw new Error("DISCORD_BOT_TOKEN, DISCORD_APPLICATION_ID, DISCORD_GUILD_ID가 필요합니다.");
}

const commands = [
  { name: "life", description: "현재 조종 캐릭터의 상태를 확인합니다." },
  { name: "world", description: "현재 캐릭터의 최근 사건을 확인합니다." },
];

const response = await fetch(`https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`, {
  method: "PUT",
  headers: { authorization: `Bot ${token}`, "content-type": "application/json" },
  body: JSON.stringify(commands),
});
if (!response.ok) throw new Error(`Discord 명령 등록 실패: ${response.status}`);
console.log("Discord 슬래시 명령을 등록했습니다.");
