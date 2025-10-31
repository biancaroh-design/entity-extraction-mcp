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
}

export default function ConversationPanel({
  selectedConversation,
  onConversationSelect,
  onConversationLoad,
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
    } else {
      setDisplayMessages([]);
      onConversationLoad([]);
    }
  }, [selectedConversation, conversations]);

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
    <div className="bg-white border-2 border-dark rounded-lg p-5 min-h-[500px]">
      <h2 className="text-lg font-semibold text-dark mb-4">대화 내용</h2>

      <select
        value={selectedConversation}
        onChange={(e) => onConversationSelect(e.target.value)}
        className="w-full p-2.5 border-2 border-dark rounded text-sm bg-white text-dark cursor-pointer mb-4"
      >
        <option value="">대화를 선택하세요</option>
        <option value="conversation1">멤버십 대화 1 (영화 & 아이스크림)</option>
        <option value="conversation2">멤버십 대화 2 (러닝 & 브런치)</option>
        <option value="delivery">배송 지연 문의</option>
      </select>

      {/* 참가자 정보 표시 */}
      {participants.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs font-semibold text-blue-800 mb-2">
            참가자 정보
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant: any, idx: number) => (
              <div
                key={idx}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getMembershipColor(
                  participant.membership
                )}`}
              >
                {participant.name} ({participant.membership})
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-[400px] overflow-y-auto p-2.5 bg-gray-50 rounded">
        {displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-gray-400 text-sm">
            대화를 선택하세요
          </div>
        ) : (
          displayMessages.map((msg, idx) => (
            <div
              key={idx}
              className="mb-3 p-3 rounded bg-white border-l-4 border-primary"
            >
              <div className="font-semibold text-primary text-xs mb-1">
                {msg.speaker}
              </div>
              <div className="text-dark text-sm">{msg.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
