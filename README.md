# HA2 Living World

캐릭터 중심 RP RPG의 웹 대시보드입니다. 웹에서 발생한 RP, 이동, 제작, 전투 시작 활동은 서버 측 `/api/discord/webhook` 경로를 거쳐 Discord 웹훅으로 전송됩니다.

## 실행

```bash
npm run dev
```

## Discord 웹훅 연결

1. Discord 서버의 원하는 채널에서 웹훅을 만듭니다.
2. 배포 환경 변수에 `DISCORD_WEBHOOK_URL`을 추가합니다.
3. 웹에서 RP 메시지 또는 행동을 실행합니다.

웹훅 전송은 서버에서 수행하므로 실제 웹훅 URL은 브라우저와 소스 코드에 노출되지 않습니다. Discord 메시지의 표시 이름은 실제 계정이 아닌 현재 캐릭터 이름입니다.

## 영구 상태와 Discord 명령

사이트는 D1 데이터베이스에 플레이어, 캐릭터, 사건을 저장하도록 준비되어 있습니다. Discord Developer Portal에서 Interaction Endpoint URL을 다음 주소로 지정하세요.

```text
https://ha2-living-world.silvercurio2.chatgpt.site/api/discord/interactions
```

배포 환경에는 `DISCORD_PUBLIC_KEY`를 비밀값으로 설정하세요. 서명이 검증된 Discord 요청만 처리합니다.

명령 등록은 로컬에서 아래 환경 변수를 설정한 후 실행합니다. 봇 토큰은 배포 환경이나 소스 코드에 저장하지 않습니다.

```bash
DISCORD_BOT_TOKEN=... DISCORD_APPLICATION_ID=... DISCORD_GUILD_ID=... node scripts/register-discord-commands.mjs
```

- `/life`: 현재 조종 캐릭터의 체력·위치·자원을 비공개 응답으로 표시
- `/world`: 현재 캐릭터에 관련된 최근 사건을 비공개 응답으로 표시

## 운영자 초기 캐릭터 배정

서버 비밀값 `ADMIN_API_KEY`를 설정하면, 운영자는 `POST /api/admin/characters`로 최초 캐릭터를 특정 사이트 사용자와 Discord 사용자에게 배정할 수 있습니다. 요청에는 `x-ha2-admin-key` 헤더와 아래 형태의 JSON을 사용합니다.

```json
{
  "name": "윤하",
  "gender": "female",
  "siteUserId": "사이트 사용자 ID",
  "discordUserId": "Discord 사용자 ID",
  "position": 128.4,
  "raw": 18,
  "food": 11,
  "clothing": 8
}
```

사이트 로그인 사용자는 `/api/me`에서 자신의 배정 상태를 확인하고, `/api/game/action`으로 이동·식 제작·섭취·재배·수확·스탯 강화·RP 발언을 실행할 수 있습니다. 모든 성공 행동은 D1 사건 기록과 Discord 웹훅으로 함께 전달됩니다.

## 현재 범위

- 캐릭터 상태·자원·지도·시설·전투 설정 대시보드
- 웹 활동의 Discord 웹훅 중계
- 명세에 따른 재배, 식 제작/섭취, 스탯 강화, 시설 건설, 공격 세션 시작 UI
- D1 기반 플레이어·캐릭터·사건 모델과 서명 검증 Discord 인터랙션 엔드포인트

운영자용 캐릭터 배정 화면과 웹 행동을 D1 상태에 직접 반영하는 API는 다음 구현 단위입니다.
# 세계 시간 정산

`POST /api/cron/settle`는 허기, 자연사, 출산 완료를 정산하는 서버 전용 경로입니다. `CRON_SECRET`을 설정하고, 같은 비밀을 `x-ha2-cron-secret` 헤더에 담아 5분 간격으로 호출하세요. 이 경로는 사용자 계정이나 Discord 정보를 노출하지 않습니다.
