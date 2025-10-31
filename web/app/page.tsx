"use client";

import { useState } from "react";
import ConversationPanel from "@/components/ConversationPanel";
import ResultPanel from "@/components/ResultPanel";

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<string>("");
  const [conversation, setConversation] = useState<any[]>([]);
  const [entities, setEntities] = useState<any>(null);
  const [actionResult, setActionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleExtractEntities = async () => {
    if (!conversation || conversation.length === 0) return;

    setLoading(true);
    setEntities(null);
    setActionResult(null);

    try {
      // Entity 추출
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation }),
      });

      if (!extractRes.ok) throw new Error("Entity 추출 실패");

      const extractedEntities = await extractRes.json();
      setEntities(extractedEntities);

      // 자동으로 액션 실행
      if (extractedEntities.type === "membership") {
        const couponRes = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entities: extractedEntities }),
        });

        if (couponRes.ok) {
          const coupons = await couponRes.json();
          setActionResult(coupons);
        }
      } else if (extractedEntities.type === "delivery_delay") {
        const ticketRes = await fetch("/api/ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entities: extractedEntities }),
        });

        if (ticketRes.ok) {
          const ticket = await ticketRes.json();
          setActionResult(ticket);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-5 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-semibold text-dark mb-8">
          Entity 추출 MCP - 대화 분석 시스템
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-5 items-start">
          {/* 왼쪽: 대화 패널 */}
          <ConversationPanel
            selectedConversation={selectedConversation}
            onConversationSelect={setSelectedConversation}
            onConversationLoad={setConversation}
          />

          {/* 중앙: 추출 버튼 */}
          <div className="flex lg:flex-col flex-row justify-center items-center gap-4 py-8">
            <button
              onClick={handleExtractEntities}
              disabled={!conversation || conversation.length === 0 || loading}
              className="bg-primary text-white px-8 py-4 rounded-lg font-semibold text-base disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              {loading ? "추출 중..." : "Entity 추출"}
            </button>
            <div className="text-4xl text-primary hidden lg:block">→</div>
            <div className="text-4xl text-primary lg:hidden">→</div>
          </div>

          {/* 오른쪽: 결과 패널 */}
          <ResultPanel entities={entities} actionResult={actionResult} />
        </div>
      </div>
    </div>
  );
}
