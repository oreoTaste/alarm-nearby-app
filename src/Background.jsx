import { registerPlugin, Capacitor } from "@capacitor/core";
import { LocalNotifications as InsideNotifications } from "@capacitor/local-notifications";
import { getDistance } from "./utils/geoUtils";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:7000/api/locations';
// 💡 .env에서 설정한 주기를 가져옴 (기본값: 5분)
const FETCH_INTERVAL = Number(import.meta.env.VITE_FETCH_INTERVAL) || 300000; 

const checkLocationsAndAlert = (latitude, longitude, globalDistance, currentLocations, isWeb = false) => {
  currentLocations.forEach(async (loc) => {
    if (!loc.isAlertEnabled) return;

    const distance = getDistance(latitude, longitude, loc.lat, loc.lng);

    if (distance <= globalDistance) {
      if (isWeb) {
        if (window.Notification && Notification.permission === "granted") {
          new Notification(`📍 목적지 근처 도착! (Web)`, {
            body: `${loc.title}까지 약 ${Math.round(distance)}m 남았습니다.`,
          });
        }
      } else {
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
    }
  });
};

export const setupBackgroundTracking = async (globalDistance) => {
  // 💡 마지막으로 서버에서 데이터를 가져온 시간을 기록할 변수
  let lastFetchTime = 0; 
  
  // ==========================================
  // 📱 1. 모바일 앱(Android / iOS) 환경일 때
  // ==========================================
  if (Capacitor.isNativePlatform()) {
    await InsideNotifications.requestPermissions();
    const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');

    BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "위치 정보를 실시간으로 확인 중입니다.",
        backgroundTitle: "GEO-PLANNER 실행 중",
        requestPermissions: true,
        stale: false,
        distanceFilter: 10 
      },
      async (location, error) => {
        if (error) return console.error(error);
        if (!location) return;

        // 💡 시간 주기 체크 (설정한 시간이 지나지 않았다면 API 요청을 스킵)
        const now = Date.now();
        if (now - lastFetchTime < FETCH_INTERVAL) return;
        
        lastFetchTime = now; // 시간 갱신

        try {
          // 💡 현재 GPS 위치(위도, 경도)를 쿼리 파라미터에 포함하여 요청
          const urlWithParams = `${BACKEND_URL}?lat=${location.latitude}&lng=${location.longitude}`;
          const response = await fetch(urlWithParams);
          if (!response.ok) return;
          const currentLocations = await response.json();

          checkLocationsAndAlert(location.latitude, location.longitude, globalDistance, currentLocations, false);
        } catch (err) {
          console.error('❌ 백그라운드 통신 에러:', err);
        }
      }
    );
  } 
  
  // ==========================================
  // 🌐 2. 웹 브라우저(Chrome, Safari 등) 환경일 때
  // ==========================================
  else {
    console.log("🌐 웹 브라우저 환경: 위치 및 알림 감시를 시작합니다.");
    
    if (window.Notification) {
      await Notification.requestPermission();
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        async (position) => {
          // 💡 웹 환경에서의 시간 주기 체크
          const now = Date.now();
          if (now - lastFetchTime < FETCH_INTERVAL) return;
          
          lastFetchTime = now;

          try {
            const { latitude, longitude } = position.coords;
            
            // 💡 웹에서도 동일하게 GPS 정보를 주소에 포함
            const urlWithParams = `${BACKEND_URL}?lat=${latitude}&lng=${longitude}`;
            const response = await fetch(urlWithParams);
            if (!response.ok) return;
            const currentLocations = await response.json();

            checkLocationsAndAlert(latitude, longitude, globalDistance, currentLocations, true);
          } catch (err) {
            console.error('❌ 웹 위치 처리 에러:', err);
          }
        },
        (err) => console.error("❌ 웹 위치 획득 실패:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }
  }
};
