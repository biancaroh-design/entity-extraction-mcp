"use client";

interface ResultPanelProps {
  entities: any;
  actionResult: any;
  loading?: boolean;
}

export default function ResultPanel({ entities, actionResult, loading = false }: ResultPanelProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-[650px] flex flex-col">
        <h2 className="text-xl font-bold text-dark mb-5">
          추출 결과 & 액션
        </h2>
        <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-100">
          {/* Skeleton loading */}
          <div className="mb-5 p-5 bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              <div className="h-3 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!entities) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-[650px] flex flex-col">
        <h2 className="text-xl font-bold text-dark mb-5">
          추출 결과 & 액션
        </h2>
        <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
          Entity를 추출하면 결과가 표시됩니다
        </div>
      </div>
    );
  }

  const handleAddToCalendar = (name: string, location: string) => {
    alert(`캘린더에 추가되었습니다:\n\n제목: ${name} 방문\n장소: ${location}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-[650px] flex flex-col">
      <h2 className="text-xl font-bold text-dark mb-5">
        추출 결과 & 액션
      </h2>

      <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-100">
        {/* Entity 정보 */}
        <div className="mb-5 p-5 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-primary text-base font-semibold mb-3">
            추출된 Entity
          </h3>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600 font-medium">유형: </span>
              <span className="text-dark font-semibold">{entities.intent}</span>
            </div>

            {entities.type === "membership" && (
              <>
                <div>
                  <span className="text-gray-600 font-medium">장소: </span>
                  <span className="text-dark font-semibold">
                    {entities.places?.join(", ") || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">시간: </span>
                  <span className="text-dark font-semibold">
                    {entities.times?.join(", ") || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">활동: </span>
                  <span className="text-dark font-semibold">
                    {entities.activities?.join(", ") || "-"}
                  </span>
                </div>
              </>
            )}

            {entities.type === "delivery_delay" && (
              <>
                <div>
                  <span className="text-gray-600 font-medium">주문번호: </span>
                  <span className="text-dark font-semibold">
                    {entities.orderNumber || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">고객명: </span>
                  <span className="text-dark font-semibold">
                    {entities.customerName || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">상품: </span>
                  <span className="text-dark font-semibold">
                    {entities.product || "-"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 액션 결과 */}
        {actionResult && actionResult.success && (
          <>
            {/* 쿠폰 추천 */}
            {actionResult.recommendedCoupons && (
              <>
                <h3 className="text-primary text-base font-semibold mb-4">
                  추천 쿠폰 ({actionResult.recommendedCoupons.length}개)
                </h3>

                {actionResult.recommendedCoupons.map((coupon: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white border-2 border-primary rounded-lg p-4 mb-4"
                  >
                    {/* 페르소나 정보 */}
                    {actionResult.participants && actionResult.participants.length > 0 && (
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <div className="text-xs text-gray-600 mb-2 font-medium">추천 대상</div>
                        <div className="flex flex-wrap gap-2">
                          {actionResult.participants.map((participant: any, pIdx: number) => (
                            <div
                              key={pIdx}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                participant.membership === 'VIP'
                                  ? 'bg-purple-100 text-purple-700'
                                  : participant.membership === 'GOLD'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {participant.name} ({participant.membership})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-2">
                      <div className="text-dark text-base font-semibold">
                        {coupon.partnerName}
                      </div>
                      <div className="bg-primary text-white px-3 py-1 rounded text-xs">
                        {coupon.category}
                      </div>
                    </div>

                    <div className="text-dark text-sm mb-2">
                      {coupon.description}
                    </div>

                    <div className="text-gray-600 text-xs mb-3">
                      📍 {coupon.location}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(coupon.mapUrl, "_blank")}
                        className="flex-1 py-2 border border-primary bg-white text-primary rounded text-xs hover:bg-primary hover:text-white transition-colors"
                      >
                        지도 보기
                      </button>
                      <button
                        onClick={() =>
                          handleAddToCalendar(
                            coupon.partnerName,
                            coupon.location
                          )
                        }
                        className="flex-1 py-2 border border-primary bg-white text-primary rounded text-xs hover:bg-primary hover:text-white transition-colors"
                      >
                        캘린더 추가
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* 티켓 발급 */}
            {actionResult.ticket && (
              <div className="bg-white border-2 border-dark rounded-lg p-4">
                <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-gray-200">
                  <div className="text-dark text-base font-semibold">
                    {actionResult.ticket.ticketId}
                  </div>
                  <div
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      actionResult.ticket.priority === "high"
                        ? "bg-dark text-white"
                        : "bg-gray-200 text-dark"
                    }`}
                  >
                    {actionResult.ticket.priority === "high" ? "높음" : "보통"}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-gray-600 text-xs font-semibold mb-2 uppercase">
                    고객 정보
                  </div>
                  <div className="text-dark text-sm">
                    {actionResult.ticket.customerInfo.name} |{" "}
                    {actionResult.ticket.customerInfo.orderNumber}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-gray-600 text-xs font-semibold mb-2 uppercase">
                    이슈 요약
                  </div>
                  <div className="text-dark text-sm mb-1">
                    {actionResult.ticket.issue.summary}
                  </div>
                  <div className="text-dark text-sm mb-1">
                    현재 상태: {actionResult.ticket.issue.deliveryStatus}
                  </div>
                  <div className="text-dark text-sm">
                    고객 의사: {actionResult.ticket.issue.customerDecision}
                  </div>
                </div>

                <div>
                  <div className="text-gray-600 text-xs font-semibold mb-2 uppercase">
                    권장 액션
                  </div>
                  {actionResult.ticket.actions.map((action: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border-l-4 border-primary p-3 mb-2 rounded"
                    >
                      <div className="text-primary font-semibold text-xs mb-1">
                        {action.type}
                      </div>
                      <div className="text-dark text-xs">
                        {action.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
