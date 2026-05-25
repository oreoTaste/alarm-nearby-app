import { BackgroundGeolocation } from '@capacitor-community/background-geolocation';
import { LocalNotifications } from '@capacitor-community/background-geolocation'; // 간혹 import 패키지 확인 필요
import { LocalNotifications as InsideNotifications } from '@capacitor/local-notifications';
import { getDistance } from './utils/geoUtils';

// 기존 코드 지우고 아래와 같이 수정
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:7000/api/locations';

export const setupBackgroundTracking = async (globalDistance) => {
  // 1. 알림 권한 요청
  await InsideNotifications.requestPermissions();

  // 2. 백그라운드 위치 감시 시작
  BackgroundGeolocation.addWatcher(
    {
      backgroundMessage: "위치 정보를 실시간으로 확인 중입니다.",
      backgroundTitle: "GEO-PLANNER 실행 중",
      requestPermissions: true,
      stale: false,
      distanceFilter: 10 // 10미터 이동할 때마다 체크
    },
    async (location, error) => {
      if (error) return console.error(error);
      if (!location) return;

      try {
        // 📍 백그라운드 구동 시 동기화를 위해 서버에서 최신 목적지 배열을 직접 가져옵니다.
        const response = await fetch(BACKEND_URL);
        if (!response.ok) return;
        const currentLocations = await response.json();

        currentLocations.forEach(async (loc) => {
          if (!loc.isAlertEnabled) return;

          const distance = getDistance(location.latitude, location.longitude, loc.lat, loc.lng);

          if (distance <= globalDistance) {
            // 🔔 조건 충족 시 푸시 알림 전송
            await InsideNotifications.schedule({
              notifications: [
                {
                  title: `📍 목적지 근처 도착!`,
                  body: `${loc.title}까지 약 ${Math.round(distance)}m 남았습니다.`,
                  id: loc.id,
                  schedule: { at: new Date(Date.now() + 1000) },
                  sound: 'default'
                }
              ]
            });
          }
        });
      } catch (err) {
        console.error('❌ 백그라운드 통신 에러:', err);
      }
    }
  );
};
