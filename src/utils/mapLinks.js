/**
 * 🌐 WGS84(Lat/Lng) 좌표를 네이버 V5 웹이 사용하는 Web Mercator(EPSG:3857)로 변환
 */
const toWebMercator = (lat, lng) => {
  const x = (lng * 20037508.34) / 180;
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * 20037508.34) / 180;
  return { x, y };
};

export const openExternalMap = (type, lat, lng, title) => {
  const encodedTitle = encodeURIComponent(title);
  let appUrl = "";
  let webUrl = "";

  switch (type) {
    case "naver": {
      // 1. Web Mercator 좌표 변환 (사용자 요청 링크 규격)
      const wm = toWebMercator(lat, lng);
      
      // 2. App URL: 앱 스키마는 표준 GPS(Lat/Lng)를 그대로 사용해도 잘 작동합니다.
      appUrl = `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${encodedTitle}&appname=my.gps.planner`;
      
      // 3. Web URL: 사용자님이 주신 최신 /p/directions/ 구조 + 변환된 좌표 적용
      // POI ID가 없는 일반 좌표이므로 ADDRESS_ALL 속성을 사용해 목적지를 고정합니다.
      webUrl = `https://map.naver.com/p/directions/-/${wm.x},${wm.y},${encodedTitle},,ADDRESS_ALL/-/dh?c=15,0,0,0,dh`;
      break;
    }

    case "kakao":
      appUrl = `kakaomap://route?ep=${lat},${lng}&by=PUBLICTRANSIT`;
      webUrl = `https://map.kakao.com/link/to/${encodedTitle},${lat},${lng}`;
      break;

    case "google":
      appUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=walking`;
      webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
      break;

    default:
      return;
  }

  // 실행 로직: 먼저 앱 실행을 시도하고, 실패 시 웹으로 전환
  const start = Date.now();
  
  // 모바일인 경우 앱 호출 시도
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    window.location.href = appUrl;
    
    // 1.5초 내에 앱이 반응 없으면 웹으로 열기
    setTimeout(() => {
      if (Date.now() - start < 1500) {
        window.open(webUrl, "_blank");
      }
    }, 500);
  } else {
    // 데스크톱인 경우 바로 웹으로 열기
    window.open(webUrl, "_blank");
  }
};
