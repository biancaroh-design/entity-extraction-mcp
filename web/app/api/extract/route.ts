import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { conversation } = await request.json();

    if (!conversation || conversation.length === 0) {
      return NextResponse.json(
        { error: "대화 내용이 비어있습니다" },
        { status: 400 }
      );
    }

    // 대화를 텍스트로 변환
    const conversationText = conversation
      .map((msg: any) => `${msg.speaker}: ${msg.text}`)
      .join("\n");

    // Claude에게 Entity 추출 요청
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `다음 대화를 분석하여 Entity를 추출해주세요.

대화:
${conversationText}

분석 지침:
1. 먼저 대화 유형을 판단하세요: "membership" (약속/만남) 또는 "delivery_delay" (배송 지연 문의)

2. membership 타입인 경우:
   - intent: 대화의 목적 (예: "약속 계획")
   - places: 언급된 모든 장소 (역, 카페, 식당 등)
   - times: 언급된 모든 시간 (요일, 시간)
   - activities: 언급된 활동 (영화, 식사, 러닝 등)
   - participants: 대화 참가자 이름

3. delivery_delay 타입인 경우:
   - intent: "배송 지연 문의"
   - orderNumber: 주문번호 (형식: XX20251024-1123)
   - customerName: 고객 이름
   - product: 상품명
   - issueSummary: 이슈 요약
   - deliveryStatus: 배송 상태
   - customerDecision: 고객 의사결정 ("취소 고려 중" 또는 "수령 대기")

JSON 형식으로만 응답하세요. 추가 설명 없이 JSON만 반환하세요.`,
        },
      ],
    });

    // Claude 응답에서 JSON 추출
    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // JSON 파싱
    let entities;
    try {
      // ```json ``` 블록 제거
      let jsonText = content.text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
      }
      entities = JSON.parse(jsonText);
    } catch (e) {
      // JSON 파싱 실패 시 원본 텍스트 반환
      console.error("JSON parse error:", e);
      console.error("Response:", content.text);
      throw new Error("Entity 추출 결과를 파싱할 수 없습니다");
    }

    return NextResponse.json(entities);
  } catch (error: any) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: error.message || "Entity 추출 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
