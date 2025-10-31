"use client";

import { useEffect, useState } from "react";

interface Message {
  speaker: string;
  text: string;
}

interface ConversationPanelProps {
  selectedConversation: string;
  onConversationSelect: (value: string) => void;
  onConversationLoad: (conversation: Message[]) => void;
  onConversationDataLoad: (data: any) => void;
}

export default function ConversationPanel({
  selectedConversation,
  onConversationSelect,
  onConversationLoad,
  onConversationDataLoad,
}: ConversationPanelProps) {
  const [conversations, setConversations] = useState<any>({});
  const [conversationData, setConversationData] = useState<any>({});
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);

  useEffect(() => {
    // 대화 데이터 로드
    const loadConversations = async () => {
      try {
        const [conv1, conv2, delivery] = await Promise.all([
          fetch("/data/conversation.json").then((r) => r.json()),
          fetch("/data/conversation2.json").then((r) => r.json()),
          fetch("/data/delivery_delay_inquiry_conversation.json").then((r) =>
            r.json()
          ),
        ]);

        setConversations({
          conversation1: conv1.call_scenario.conversation,
          conversation2: conv2.call_scenario.conversation,
          delivery: delivery.conversation,
        });

        setConversationData({
          conversation1: conv1.call_scenario,
          conversation2: conv2.call_scenario,
          delivery: null,
        });
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };

    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation && conversations[selectedConversation]) {
      const messages = conversations[selectedConversation];
      setDisplayMessages(messages);
      onConversationLoad(messages);
      onConversationDataLoad(conversationData[selectedConversation]);
    } else {
      setDisplayMessages([]);
      onConversationLoad([]);
      onConversationDataLoad(null);
    }
  }, [selectedConversation, conversations, conversationData]);

  const currentData = conversationData[selectedConversation];
  const participants = currentData?.participants || [];

  const getMembershipColor = (tier: string) => {
    switch (tier) {
      case "VIP":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "GOLD":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "SILVER":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-[650px] flex flex-col">
      <h2 className="text-xl font-bold text-dark mb-5">대화 내용</h2>

      <select
        value={selectedConversation}
        onChange={(e) => onConversationSelect(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white text-dark cursor-pointer mb-5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <option value="">대화를 선택하세요</option>
        <option value="conversation1">멤버십 대화 1 (영화 & 아이스크림)</option>
        <option value="conversation2">멤버십 대화 2 (러닝 & 브런치)</option>
        <option value="delivery">배송 지연 문의</option>
      </select>

      {/* 참가자 정보 표시 */}
      {participants.length > 0 && (
        <div className="mb-5 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="text-xs font-bold text-blue-900 mb-3 uppercase tracking-wide">
            참가자 정보
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant: any, idx: number) => (
              <div
                key={idx}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${getMembershipColor(
                  participant.membership
                )}`}
              >
                {participant.name} ({participant.membership})
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-100">
        {displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            대화를 선택하세요
          </div>
        ) : (
          displayMessages.map((msg, idx) => (
            <div
              key={idx}
              className="mb-3 p-4 rounded-lg bg-white border-l-4 border-primary shadow-sm"
            >
              <div className="font-bold text-primary text-xs mb-2 uppercase tracking-wide">
                {msg.speaker}
              </div>
              <div className="text-dark text-sm leading-relaxed">{msg.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
