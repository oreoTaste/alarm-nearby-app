import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider, Map, Marker, useMap, Polyline } from '@vis.gl/react-google-maps';
import { Menu, Crosshair } from 'lucide-react';
import SearchBox from './components/SearchBox';
import Sidebar from './components/Sidebar';
import { sortByNearest } from './utils/geoUtils';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
// 기존 코드 지우고 아래와 같이 수정
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:7000/api/locations';

function MapHandler({ targetPos }) {
  const map = useMap();
  useEffect(() => {
    if (map && targetPos) {
      map.panTo(targetPos);
      map.setZoom(16);
    }
  }, [map, targetPos]);
  return null;
}

function CurrentLocationButton({ myPos }) {
  const map = useMap();
  const handleCenter = useCallback(() => {
    if (!map || !myPos) {
      alert("위치 정보를 수신 중입니다. GPS를 확인해 주세요.");
      return;
    }
    map.panTo(myPos);
    map.setZoom(16);
  }, [map, myPos]);

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); handleCenter(); }}
      className="fixed bottom-10 right-6 z-[60] w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-blue-600 border border-slate-100 active:scale-90 transition-all hover:bg-blue-50 shadow-blue-500/20"
      title="내 위치로 이동"
    >
      <Crosshair size={28} />
    </button>
  );
}

export default function App() {
  // --- 1. 상태 관리 (초기값은 빈 배열) ---
  const [locations, setLocations] = useState([]);
  const [globalDistance, setGlobalDistance] = useState(200);
  const [myPos, setMyPos] = useState(null);
  
  const [searchedPos, setSearchedPos] = useState(null);
  const [searchedTitle, setSearchedTitle] = useState('');
  const [selectedPos, setSelectedPos] = useState(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState('전체');
  const [isSorted, setIsSorted] = useState(false);
  const [formData, setFormData] = useState({ title: '', note: '', group: '기본' });

// 🔍 [로그 추가] 컴포넌트 로드 시 현재 백엔드 URL 스펙 확인
  console.log("📢 [프론트엔드 구동] 현재 인식된 백엔드 URL:", BACKEND_URL);
  console.log("📢 [Vite 환경변수 전체 원본]:", import.meta.env);

  // --- 2. 실시간 GPS 추적 ---
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(p => {
      setMyPos({ lat: p.coords.latitude, lng: p.coords.longitude });
    }, null, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // --- 3. 백엔드에서 초기 데이터 로드 (READ) ---
// --- 3. 백엔드에서 초기 데이터 로드 (READ) ---
  useEffect(() => {
    const fetchLocations = async () => {
      console.log(`📡 [요청 시도] GET -> ${BACKEND_URL}`);
      try {
        const response = await fetch(BACKEND_URL);
        console.log("🍏 [요청 성공] 응답 상태코드:", response.status);
        if (!response.ok) throw new Error(`Network response was not ok (Status: ${response.status})`);
        const data = await response.json();
        setLocations(data);
      } catch (err) {
        // 🔍 [로그 추가] 에러의 구체적인 메시지와 객체 출력
        console.error('❌ [요청 실패] GET locations 에러 상세:', err);
      }
    };
    fetchLocations();
  }, []);

  // --- 4. 데이터 가공 (필터링 및 정렬) ---
  const groups = useMemo(() => ['전체', ...new Set(locations.map(l => l.group).filter(Boolean))], [locations]);
  
  const displayList = useMemo(() => {
    let list = activeGroup === '전체' ? [...locations] : locations.filter(l => l.group === activeGroup);
    return (isSorted && myPos) ? sortByNearest(myPos, list) : list;
  }, [locations, activeGroup, isSorted, myPos]);

  const routePath = useMemo(() => 
    (isSorted && myPos && displayList.length > 0) ? [myPos, ...displayList.map(l => ({ lat: l.lat, lng: l.lng }))] : [], 
  [isSorted, myPos, displayList]);

  // --- 5. 이벤트 핸들러 ---
  const handlePlaceSelect = (pos, title) => {
    setSearchedPos(pos);
    setSearchedTitle(title);
    setIsPanelOpen(false);
  };

  // 📍 신규 목적지 저장 (CREATE)
  const handleSaveLocation = async () => {
    if(!formData.title) return alert('제목을 입력해 주세요.');
    
    const payload = {
      title: formData.title,
      note: formData.note,
      group: formData.group,
      lat: selectedPos.lat,
      lng: selectedPos.lng,
      isAlertEnabled: true
    };

    console.log(`📡 [요청 시도] POST -> ${BACKEND_URL} | 데이터:`, payload);

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log("🍏 [요청 성공] 응답 상태코드:", response.status);
      if (!response.ok) throw new Error('Save failed');
      
      const savedLocation = await response.json();
      // 최신 등록 순으로 상단에 추가
      setLocations([savedLocation, ...locations]);
      setSelectedPos(null);
      setSearchedPos(null);
    } catch (err) {
      console.error('❌ [요청 실패] POST location 에러 상세:', err);
      alert('서버에 저장하지 못했습니다. 백엔드 상태를 확인하세요.');
    }
  };

  // 📍 알림 토글 처리 (UPDATE)
  const handleToggleAlert = async (id, currentStatus) => {
    try {
      const response = await fetch(`${BACKEND_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAlertEnabled: !currentStatus })
      });

      if (!response.ok) throw new Error('Update failed');
      const updatedLocation = await response.json();

      setLocations(locations.map(l => l.id === id ? updatedLocation : l));
    } catch (err) {
      console.error(err);
      alert('알림 상태 변경에 실패했습니다.');
    }
  };

  // 📍 목적지 삭제 처리 (DELETE)
  const handleDeleteLocation = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');
      
      setLocations(locations.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
      alert('목적지 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden font-sans">
      <APIProvider apiKey={API_KEY}>
        <MapHandler targetPos={searchedPos} />
        
        <div className="fixed top-4 inset-x-0 mx-auto z-[40] w-full max-w-[500px] px-16 md:px-0">
          <SearchBox onPlaceSelect={handlePlaceSelect} />
        </div>

        <CurrentLocationButton myPos={myPos} />

        <div className="absolute inset-0 z-0">
          <Map 
            defaultCenter={{ lat: 37.5665, lng: 126.9780 }} 
            defaultZoom={14} 
            disableDefaultUI 
            onClick={e => {
              if (isPanelOpen) {
                setIsPanelOpen(false);
                setSelectedPos(null);
                setSearchedPos(null);
              } else {
                setSelectedPos({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
                setFormData({ title: '', note: '', group: '기본' });
                setIsPanelOpen(true);
                setSearchedPos(null); 
              }
            }}
            style={{ width: '100%', height: '100%' }}
          >
            {myPos && <Marker position={myPos} zIndex={10} icon={{ path: 0, fillColor: '#3b82f6', fillOpacity: 1, strokeWeight: 3, strokeColor: '#ffffff', scale: 8 }} />}
            {displayList.map(l => <Marker key={l.id} position={{ lat: l.lat, lng: l.lng }} />)}
            {searchedPos && (
              <Marker 
                position={searchedPos} 
                zIndex={20}
                onClick={() => {
                  setSelectedPos(searchedPos);
                  setFormData(f => ({ ...f, title: searchedTitle }));
                  setIsPanelOpen(true);
                }}
              />
            )}
            {selectedPos && <Marker position={selectedPos} zIndex={5} />}
            {isSorted && routePath.length > 1 && (
              <Polyline path={routePath} strokeColor="#3b82f6" strokeOpacity={0.8} strokeWeight={4} />
            )}
          </Map>
        </div>

        {!isPanelOpen && (
          <button 
            onClick={() => setIsPanelOpen(true)} 
            className="fixed top-4 left-4 z-[50] w-12 h-12 bg-white rounded-xl shadow-2xl flex items-center justify-center text-slate-800 border border-slate-100 active:scale-95 transition-all"
          >
            <Menu size={24} />
          </button>
        )}

        <Sidebar 
          isOpen={isPanelOpen} 
          onClose={() => setIsPanelOpen(false)} 
          groups={groups} 
          activeGroup={activeGroup} 
          setActiveGroup={setActiveGroup} 
          displayList={displayList} 
          isSorted={isSorted} 
          setIsSorted={setIsSorted} 
          selectedPos={selectedPos} 
          formData={formData} 
          setFormData={setFormData} 
          onSave={handleSaveLocation} 
          onCancelSelection={() => { setSelectedPos(null); setSearchedPos(null); }} 
          onToggleAlert={(id) => {
            const target = locations.find(l => l.id === id);
            if(target) handleToggleAlert(id, target.isAlertEnabled);
          }} 
          onDelete={handleDeleteLocation} 
          globalDistance={globalDistance} 
          setGlobalDistance={setGlobalDistance} 
          myPos={myPos}
        />
      </APIProvider>
    </div>
  );
}
