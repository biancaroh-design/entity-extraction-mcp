import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const { entities, participants = [] } = await request.json();

    if (entities.type !== "membership") {
      return NextResponse.json(
        {
          success: false,
          error: "멤버십 타입의 Entity만 쿠폰 추천이 가능합니다",
        },
        { status: 400 }
      );
    }

    // 멤버십 데이터 로드
    const dataPath = join(
      process.cwd(),
      "public",
      "data",
      "membership_personas_and_partners_kr.json"
    );
    const data = await readFile(dataPath, "utf-8");
    const membershipData = JSON.parse(data);

    const places = entities.places || [];
    const activities = entities.activities || [];

    // 파트너 매칭
    const matchedPartners = matchPartners(places, membershipData.partners);

    // 쿠폰 생성
    const coupons = matchedPartners.map((partner: any) => {
      const benefits = partner.benefits[0];
      let description = "";

      // 혜택 설명 생성
      if (benefits.type === "percent_discount_or_points") {
        description = `VIP ${benefits.value_percent}% 할인/포인트 (월 ${benefits.limit.count}회)`;
      } else if (benefits.type === "percent_discount") {
        description = `전 등급 ${benefits.value_percent}% 할인`;
      } else if (benefits.movie) {
        description = `연간 무료 ${benefits.movie.free_tickets_per_year}회, 1+1 ${benefits.movie.one_plus_one_per_year}회`;
      } else if (benefits.ticket) {
        description = `본인 ${benefits.ticket.member_percent}% 할인, 동반 ${benefits.ticket.companions_count}인 ${benefits.ticket.companions_percent}% 할인`;
      }

      // 가장 가까운 위치 찾기
      let nearestLocation = partner.locations[0];
      for (const place of places) {
        for (const location of partner.locations) {
          if (
            location.near.includes(place) ||
            place.includes(location.near.split(" ")[0])
          ) {
            nearestLocation = location;
            break;
          }
        }
      }

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        category: partner.category,
        description,
        location: nearestLocation.near,
        mapUrl: nearestLocation.map_url,
        benefits,
        calendarEvent: {
          title: `${partner.name} 방문`,
          location: nearestLocation.near,
          description: `${description}\n지도: ${nearestLocation.map_url}`,
        },
      };
    });

    return NextResponse.json({
      success: true,
      conversationType: entities.type,
      intent: entities.intent,
      extractedInfo: {
        places,
        times: entities.times || [],
        activities,
      },
      participants,
      recommendedCoupons: coupons,
      message:
        coupons.length > 0
          ? `${coupons.length}개의 쿠폰을 추천합니다`
          : "매칭되는 쿠폰이 없습니다",
    });
  } catch (error: any) {
    console.error("Recommend error:", error);
    return NextResponse.json(
      { error: error.message || "쿠폰 추천 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

function matchPartners(places: string[], partners: any[]): any[] {
  const matched: any[] = [];
  const matchedIds = new Set();

  for (const place of places) {
    const placeLower = place.toLowerCase().replace(/\s/g, "");

    for (const partner of partners) {
      if (matchedIds.has(partner.id)) continue;

      // 파트너명 매칭
      const partnerName = partner.name.toLowerCase().replace(/\s/g, "");
      if (partnerName.includes(placeLower) || placeLower.includes(partnerName)) {
        matched.push(partner);
        matchedIds.add(partner.id);
        continue;
      }

      // 위치 기반 매칭
      for (const location of partner.locations) {
        if (
          location.near.includes(place) ||
          place.includes(location.near.split(" ")[0])
        ) {
          if (!matchedIds.has(partner.id)) {
            matched.push(partner);
            matchedIds.add(partner.id);
          }
          break;
        }
      }
    }
  }

  return matched;
}
