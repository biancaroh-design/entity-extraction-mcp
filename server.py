#!/usr/bin/env python3
"""
Entity 추출 MCP 서버
대화 데이터를 리소스로 제공하고, 쿠폰 추천 및 티켓 발급 도구 제공
Claude가 대화를 읽고 직접 Entity를 분석합니다
"""

import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Any
from mcp.server.models import InitializationOptions
import mcp.types as types
from mcp.server import NotificationOptions, Server
import mcp.server.stdio


# 서버 인스턴스 생성
server = Server("entity-extraction-mcp")

# 데이터 경로
BASE_DIR = Path(__file__).parent
CONVERSATION1_PATH = BASE_DIR / "conversation.json"
CONVERSATION2_PATH = BASE_DIR / "conversation2.json"
DELIVERY_PATH = BASE_DIR / "delivery_delay_inquiry_conversation.json"
MEMBERSHIP_DATA_PATH = BASE_DIR / "membership_personas_and_partners_kr.json"


def load_json_file(path: Path) -> dict:
    """JSON 파일 로드"""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def match_partners(places: list[str], partners: list[dict]) -> list[dict]:
    """장소명과 파트너 매칭"""
    matched = []
    matched_ids = set()

    for place in places:
        place_lower = place.lower().replace(' ', '')

        for partner in partners:
            if partner['id'] in matched_ids:
                continue

            # 파트너명 매칭
            partner_name = partner['name'].lower().replace(' ', '')
            if partner_name in place_lower or place_lower in partner_name:
                matched.append(partner)
                matched_ids.add(partner['id'])
                continue

            # 위치 기반 매칭
            for location in partner['locations']:
                if place in location['near'] or location['near'].split(' ')[0] in place:
                    if partner['id'] not in matched_ids:
                        matched.append(partner)
                        matched_ids.add(partner['id'])
                    break

    return matched


@server.list_resources()
async def handle_list_resources() -> list[types.Resource]:
    """MCP 리소스 목록 반환 - 대화 데이터"""
    return [
        types.Resource(
            uri="conversation://1",
            name="멤버십 대화 1 (영화 & 아이스크림)",
            description="이바다와 김루가의 주말 약속 대화",
            mimeType="application/json",
        ),
        types.Resource(
            uri="conversation://2",
            name="멤버십 대화 2 (러닝 & 브런치)",
            description="최가벨과 박벨루의 러닝 모임 대화",
            mimeType="application/json",
        ),
        types.Resource(
            uri="conversation://delivery",
            name="배송 지연 문의",
            description="김은지의 러닝화 배송 지연 문의 대화",
            mimeType="application/json",
        ),
        types.Resource(
            uri="data://membership",
            name="멤버십 파트너 정보",
            description="멤버십 등급, 페르소나, 파트너 혜택 정보",
            mimeType="application/json",
        ),
    ]


@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """MCP 리소스 읽기"""
    if uri == "conversation://1":
        data = load_json_file(CONVERSATION1_PATH)
        return json.dumps(data, ensure_ascii=False, indent=2)
    elif uri == "conversation://2":
        data = load_json_file(CONVERSATION2_PATH)
        return json.dumps(data, ensure_ascii=False, indent=2)
    elif uri == "conversation://delivery":
        data = load_json_file(DELIVERY_PATH)
        return json.dumps(data, ensure_ascii=False, indent=2)
    elif uri == "data://membership":
        data = load_json_file(MEMBERSHIP_DATA_PATH)
        return json.dumps(data, ensure_ascii=False, indent=2)
    else:
        raise ValueError(f"Unknown resource URI: {uri}")


@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """MCP 도구 목록 반환"""
    return [
        types.Tool(
            name="recommend_coupons",
            description="추출된 Entity를 기반으로 멤버십 쿠폰을 추천합니다. places 배열이 필요합니다.",
            inputSchema={
                "type": "object",
                "properties": {
                    "places": {
                        "type": "array",
                        "description": "대화에서 추출된 장소 목록 (예: ['강남역', 'CCW 영화관'])",
                        "items": {"type": "string"}
                    },
                    "times": {
                        "type": "array",
                        "description": "대화에서 추출된 시간 목록 (선택사항)",
                        "items": {"type": "string"}
                    },
                    "activities": {
                        "type": "array",
                        "description": "대화에서 추출된 활동 목록 (선택사항)",
                        "items": {"type": "string"}
                    }
                },
                "required": ["places"]
            },
        ),
        types.Tool(
            name="issue_ticket",
            description="배송 지연 건에 대한 티켓을 발급합니다.",
            inputSchema={
                "type": "object",
                "properties": {
                    "orderNumber": {
                        "type": "string",
                        "description": "주문번호"
                    },
                    "customerName": {
                        "type": "string",
                        "description": "고객명"
                    },
                    "product": {
                        "type": "string",
                        "description": "상품명"
                    },
                    "issueSummary": {
                        "type": "string",
                        "description": "이슈 요약"
                    },
                    "deliveryStatus": {
                        "type": "string",
                        "description": "배송 상태"
                    },
                    "customerDecision": {
                        "type": "string",
                        "description": "고객 의사결정 (취소 고려 중 / 수령 대기)"
                    }
                },
                "required": ["orderNumber", "customerName", "product"]
            },
        ),
    ]


@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """MCP 도구 실행"""
    try:
        if name == "recommend_coupons":
            places = arguments.get("places", [])
            times = arguments.get("times", [])
            activities = arguments.get("activities", [])

            # 멤버십 데이터 로드
            membership_data = load_json_file(MEMBERSHIP_DATA_PATH)

            # 파트너 매칭
            matched_partners = match_partners(places, membership_data['partners'])

            # 쿠폰 생성
            coupons = []
            for partner in matched_partners:
                benefits = partner['benefits'][0]
                description = ''

                # 혜택 설명 생성
                if benefits.get('type') == 'percent_discount_or_points':
                    description = f"VIP {benefits['value_percent']}% 할인/포인트 (월 {benefits['limit']['count']}회)"
                elif benefits.get('type') == 'percent_discount':
                    description = f"전 등급 {benefits['value_percent']}% 할인"
                elif benefits.get('movie'):
                    movie = benefits['movie']
                    description = f"연간 무료 {movie['free_tickets_per_year']}회, 1+1 {movie['one_plus_one_per_year']}회"
                elif benefits.get('ticket'):
                    ticket = benefits['ticket']
                    description = f"본인 {ticket['member_percent']}% 할인, 동반 {ticket['companions_count']}인 {ticket['companions_percent']}% 할인"

                # 가장 가까운 위치 찾기
                nearest_location = partner['locations'][0]
                for place in places:
                    for location in partner['locations']:
                        if place in location['near'] or location['near'].split(' ')[0] in place:
                            nearest_location = location
                            break

                coupons.append({
                    'partnerId': partner['id'],
                    'partnerName': partner['name'],
                    'category': partner['category'],
                    'description': description,
                    'location': nearest_location['near'],
                    'mapUrl': nearest_location['map_url']
                })

            # 쿠폰 목록만 반환 (간결하게)
            if not coupons:
                return [types.TextContent(
                    type="text",
                    text="매칭되는 쿠폰이 없습니다"
                )]

            result = {
                'coupons': coupons
            }

            return [types.TextContent(
                type="text",
                text=json.dumps(result, ensure_ascii=False, indent=2)
            )]

        elif name == "issue_ticket":
            import random
            import string

            ticket_id = f"TKT-{int(datetime.now().timestamp())}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=9))}"
            created_at = datetime.now().isoformat()

            customer_decision = arguments.get('customerDecision', '수령 대기')
            priority = 'high' if customer_decision == '취소 고려 중' else 'medium'

            ticket = {
                'ticketId': ticket_id,
                'type': 'delivery_delay',
                'status': 'open',
                'priority': priority,
                'createdAt': created_at,
                'customerInfo': {
                    'name': arguments.get('customerName'),
                    'orderNumber': arguments.get('orderNumber')
                },
                'issue': {
                    'summary': arguments.get('issueSummary', '배송 지연'),
                    'product': arguments.get('product'),
                    'deliveryStatus': arguments.get('deliveryStatus', '이동 중'),
                    'customerDecision': customer_decision
                },
                'actions': []
            }

            # 권장 액션 추가
            if customer_decision == '취소 고려 중':
                ticket['actions'].extend([
                    {
                        'type': 'offer_cancellation',
                        'description': '취소 절차 안내 및 환불 처리',
                        'priority': 'high'
                    },
                    {
                        'type': 'offer_compensation',
                        'description': '배송 지연 보상 쿠폰 제공',
                        'priority': 'medium'
                    }
                ])
            else:
                ticket['actions'].extend([
                    {
                        'type': 'track_delivery',
                        'description': '배송 상태 모니터링',
                        'priority': 'high'
                    },
                    {
                        'type': 'customer_notification',
                        'description': '도착 예정 시간 문자 발송',
                        'priority': 'medium'
                    }
                ])

            # 티켓 정보만 반환 (간결하게)
            return [types.TextContent(
                type="text",
                text=json.dumps(ticket, ensure_ascii=False, indent=2)
            )]

        else:
            raise ValueError(f"Unknown tool: {name}")

    except Exception as e:
        return [types.TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]


async def main():
    """서버 실행"""
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="entity-extraction-mcp",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    asyncio.run(main())
