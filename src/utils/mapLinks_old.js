export const openExternalMap = (type, lat, lng, title) => {
  const encodedTitle = encodeURIComponent(title);
  
  // 좌표 소수점 7자리까지 고정 (네이버 권장사항)
  const fixedLat = Number(lat).toFixed(7);
  const fixedLng = Number(lng).toFixed(7);

  let url = "";

  switch (type) {
    case "naver":
      // 네이버 V5 공식 길찾기 (도보 모드 강제)
      // 이 형식은 앱 설치 여부를 확인하고 자동으로 목적지를 세팅합니다.
      url = `https://map.naver.com/v5/directions/-/-/${fixedLat},${fixedLng},${encodedTitle}/-/walk?c=15,0,0,0,dh`;
      break;
    case "kakao":
      // 카카오맵 목적지 세팅
      url = `https://map.kakao.com/link/to/${encodedTitle},${fixedLat},${fixedLng}`;
      break;
    case "google":
      // 구글맵 도보 길찾기
      url = `https://www.google.com/maps/dir/?api=1&destination=${fixedLat},${fixedLng}&travelmode=walking`;
      break;
  }

  if (url) {
    // 새 창으로 열어서 현재 앱 상태 유지
    window.open(url, "_blank");
  }
};
