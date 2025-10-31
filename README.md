# Entity 추출 MCP + Next.js Web UI

대화에서 **AI(Claude)가 Entity를 추출**하고 즉시 액션(쿠폰 추천, 티켓 발급)으로 연결하는 시스템입니다.

## 주요 특징

### 1. **AI 기반 Entity 추출**
- **Anthropic Claude API**를 사용하여 대화 분석
- 자동 대화 유형 감지 (멤버십 vs 배송 지연)
- 정확한 정보 추출 (장소, 시간, 활동, 주문정보 등)

### 2. **2가지 사용 방법**
- **웹 UI**: Next.js 기반 미니멀 인터페이스
- **Claude Desktop**: MCP 서버 통합 사용

### 3. **즉시 액션**
- **멤버십**: 쿠폰 추천 + 지도 연동 + 캘린더 추가
- **배송 지연**: 티켓 자동 발급 + 권장 액션 제시

## 프로젝트 구조

```
testEntityMCP/
├── server.py                 # Python MCP 서버 (Claude Desktop용)
├── requirements.txt          # Python 의존성
├── pyproject.toml           # Python 프로젝트 설정
├── web/                     # Next.js 웹 UI
│   ├── app/
│   │   ├── page.tsx         # 메인 페이지
│   │   ├── layout.tsx       # 레이아웃
│   │   ├── globals.css      # 글로벌 스타일
│   │   └── api/             # API 라우트
│   │       ├── extract/     # Entity 추출 (Claude API)
│   │       ├── recommend/   # 쿠폰 추천
│   │       └── ticket/      # 티켓 발급
│   ├── components/          # React 컴포넌트
│   │   ├── ConversationPanel.tsx
│   │   └── ResultPanel.tsx
│   ├── public/data/         # JSON 데이터
│   └── package.json
├── conversation.json        # 멤버십 대화 1
├── conversation2.json       # 멤버십 대화 2
├── delivery_delay_inquiry_conversation.json
├── membership_personas_and_partners_kr.json
└── claude_desktop_config.json  # Claude Desktop 설정 예시
```

## 설치 및 실행

### 필수 요구사항

- **Python 3.10+**
- **Node.js 18+**
- **Anthropic API Key** (웹 UI 사용 시)

### 1. Python MCP 서버 설정 (Claude Desktop용)

```bash
# Python 의존성 설치
pip install -r requirements.txt

# 또는 uv 사용
uv pip install -e .
```

### 2. Next.js 웹 UI 설정

```bash
# 웹 디렉토리로 이동
cd web

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일을 열어서 ANTHROPIC_API_KEY 설정
```

`.env.local` 파일:
```env
ANTHROPIC_API_KEY=your-api-key
```

### 3. 웹 UI 실행

```bash
# 개발 모드
cd web
npm run dev

# 브라우저에서 열기
open http://localhost:3000
```

### 4. Claude Desktop MCP 설정

#### 설정 파일 위치:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### 설정 파일에 추가:

```json
{
  "mcpServers": {
    "entity-extraction": {
      "command": "/Users/YOUR_USERNAME/.local/bin/uv",
      "args": [
        "--directory",
        "/Users/YOUR_USERNAME/Desktop/testEntityMCP",
        "run",
        "entity-extraction-mcp"
      ]
    }
  }
}
```

**중요**:
- `YOUR_USERNAME`을 본인의 사용자명으로 변경하세요
- `uv` 경로 확인: `which uv` 명령어로 확인 가능
- 프로젝트 디렉토리 경로를 본인의 실제 경로로 변경하세요

#### 적용:
Claude Desktop을 **완전히 종료**하고 다시 실행하면 MCP 서버가 활성화됩니다.

## 사용 방법

### 웹 UI 사용

1. `http://localhost:3000` 접속
2. 왼쪽에서 대화 선택
3. "Entity 추출" 버튼 클릭
4. 오른쪽에서 결과 확인
5. 쿠폰 "지도 보기" 또는 "캘린더 추가" 클릭

### Claude Desktop 사용

#### 멤버십 대화 쿠폰 추천:
1. Claude Desktop 실행
2. 다음과 같이 요청:
   ```
   멤버십 대화 1을 읽고 장소를 추출한 다음, 쿠폰을 추천해줘
   ```

Claude가 자동으로:
- `conversation://1` 리소스를 읽어서 대화 분석
- 장소, 시간, 활동 추출
- `recommend_coupons` 도구를 호출하여 쿠폰 추천
- 결과를 JSON 형태로 반환

#### 배송 지연 티켓 발급:
```
배송 지연 문의 대화를 읽고, 티켓을 발급해줘
```

Claude가 자동으로:
- `conversation://delivery` 리소스를 읽어서 대화 분석
- 주문번호, 고객명, 상품, 상황 추출
- `issue_ticket` 도구를 호출하여 티켓 생성
- 티켓 ID와 우선순위 반환

## UI 특징 (미니멀 디자인)

- **2가지 색상**: 파랑 (#2563eb) + 검정 (#1f2937)
- **3단 레이아웃**:
  1. 대화 선택 & 표시
  2. Entity 추출 버튼
  3. 결과 & 액션
- **Tailwind CSS** 사용
- **반응형** 디자인

## MCP 서버 기능

### 리소스 (Resources)
MCP 서버가 제공하는 대화 데이터:

- `conversation://1` - 멤버십 대화 1 (영화 & 아이스크림)
- `conversation://2` - 멤버십 대화 2 (러닝 & 브런치)
- `conversation://delivery` - 배송 지연 문의
- `data://membership` - 멤버십 파트너 정보

### 도구 (Tools)

#### 1. `recommend_coupons`
멤버십 쿠폰 추천

**입력**:
```json
{
  "places": ["강남역", "CCW 영화관"],
  "times": ["토요일 4시"],
  "activities": ["영화", "아이스크림"]
}
```

**출력**:
```json
{
  "success": true,
  "recommendedCoupons": [
    {
      "partnerName": "CCW 영화관",
      "description": "연간 무료 3회, 1+1 9회",
      "location": "신논현역 6번 출구 근처",
      "mapUrl": "https://naver.me/..."
    }
  ]
}
```

#### 2. `issue_ticket`
배송 지연 티켓 발급

**입력**:
```json
{
  "orderNumber": "SP20251024-1123",
  "customerName": "김은지",
  "product": "러닝화",
  "issueSummary": "배송 예정일 경과, 미도착",
  "deliveryStatus": "물류센터 대기 중",
  "customerDecision": "취소 고려 중"
}
```

**출력**:
```json
{
  "success": true,
  "ticket": {
    "ticketId": "TKT-1234567890-ABC",
    "priority": "high",
    "actions": [
      {
        "type": "offer_cancellation",
        "description": "취소 절차 안내 및 환불 처리"
      }
    ]
  }
}
```

## 시연 시나리오

### 시나리오 1: 웹 UI - 멤버십 대화

1. **대화 선택**: "멤버십 대화 1" 선택
2. **Entity 추출**: Claude AI가 자동 분석
   - 장소: 강남역, CCW 영화관, 베스킨 랄라스
   - 시간: 토요일 4시
   - 활동: 영화, 아이스크림
3. **쿠폰 추천**: 2개 자동 추천
   - CCW 영화관 (무료 티켓)
   - 베스킨 랄라스 (50% 할인)
4. **액션**: 지도 보기 → 네이버 지도 열림

### 시나리오 2: Claude Desktop - 배송 지연

Claude에게 요청:
```
conversation://delivery 리소스를 읽고,
고객의 주문번호, 이름, 상품명, 배송 상태를 추출해줘.
그리고 issue_ticket 도구로 티켓을 발급해줘.
```

Claude가:
1. 대화 분석
2. Entity 추출
3. `issue_ticket` 도구 자동 호출
4. 티켓 발급 결과 반환

## 기술 스택

### 프론트엔드
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React 18**

### 백엔드
- **Python 3.10+**
- **MCP SDK** (Model Context Protocol)
- **Anthropic Claude API** (Sonnet 3.5)

## 트러블슈팅

### 웹 UI가 안 보여요
```bash
cd web
npm run dev
# http://localhost:3000 접속
```

### Anthropic API 오류
`.env.local` 파일에 올바른 API 키가 설정되어 있는지 확인하세요.

### Claude Desktop에서 MCP 서버가 안 보여요
1. `claude_desktop_config.json` 파일 경로 확인
2. `server.py`의 **절대 경로**를 사용했는지 확인
3. Claude Desktop 재시작

### Python 의존성 오류
```bash
pip install --upgrade mcp
```

## 라이선스

MIT

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.
# entity-extraction-mcp
