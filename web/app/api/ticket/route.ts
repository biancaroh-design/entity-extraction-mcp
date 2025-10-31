import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { entities } = await request.json();

    if (entities.type !== "delivery_delay") {
      return NextResponse.json(
        {
          success: false,
          error: "배송 지연 타입의 Entity만 티켓 발급이 가능합니다",
        },
        { status: 400 }
      );
    }

    const ticketId = `TKT-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)
      .toUpperCase()}`;
    const createdAt = new Date().toISOString();

    const priority =
      entities.customerDecision === "취소 고려 중" ? "high" : "medium";

    const ticket = {
      ticketId,
      type: "delivery_delay",
      status: "open",
      priority,
      createdAt,
      customerInfo: {
        name: entities.customerName,
        orderNumber: entities.orderNumber,
      },
      issue: {
        summary: entities.issueSummary,
        product: entities.product,
        deliveryStatus: entities.deliveryStatus,
        customerDecision: entities.customerDecision,
      },
      actions: [] as any[],
      notes: [],
    };

    // 권장 액션 추가
    if (entities.customerDecision === "취소 고려 중") {
      ticket.actions.push(
        {
          type: "취소 절차 안내",
          description: "취소 절차 안내 및 환불 처리",
          priority: "high",
        },
        {
          type: "보상 쿠폰 제공",
          description: "배송 지연 보상 쿠폰 제공",
          priority: "medium",
        }
      );
    } else {
      ticket.actions.push(
        {
          type: "배송 추적",
          description: "배송 상태 모니터링",
          priority: "high",
        },
        {
          type: "고객 알림",
          description: "도착 예정 시간 문자 발송",
          priority: "medium",
        }
      );
    }

    return NextResponse.json({
      success: true,
      conversationType: entities.type,
      intent: entities.intent,
      ticket,
      message: `티켓 ${ticketId}이 발급되었습니다`,
    });
  } catch (error: any) {
    console.error("Ticket error:", error);
    return NextResponse.json(
      { error: error.message || "티켓 발급 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
