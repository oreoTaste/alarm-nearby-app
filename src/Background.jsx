import { BackgroundGeolocation } from '@capacitor-community/background-geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getDistance } from './utils/geoUtils';

const setupBackgroundTracking = async (locations, globalDistance) => {
  // 1. 알림 권한 요청
  await LocalNotifications.requestPermissions();

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

      // 저장된 위치들과의 거리 계산
      locations.forEach(async (loc) => {
        if (!loc.isAlertEnabled) return;

        const distance = getDistance(location.latitude, location.longitude, loc.lat, loc.lng);

        if (distance <= globalDistance) {
          // 🔔 조건 충족 시 푸시 알림 전송
          await LocalNotifications.schedule({
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
    }
  );
};
