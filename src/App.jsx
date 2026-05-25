import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider, Map, Marker, useMap, Polyline } from '@vis.gl/react-google-maps';
import { Menu, Crosshair } from 'lucide-react';
import SearchBox from './components/SearchBox';
import Sidebar from './components/Sidebar';
import { getDistance, sortByNearest } from './utils/geoUtils';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// 📍 [유틸] 검색 시 지도 중심을 해당 위치로 부드럽게 이동시키는 컴포넌트
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

// 📍 [컴포넌트] 내 위치 버튼 (화면 오른쪽 아래 고정)
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
  // --- 1. 상태 관리 ---
  const [locations, setLocations] = useState(() => JSON.parse(localStorage.getItem('geo_locations')) || []);
  const [globalDistance, setGlobalDistance] = useState(200);
  const [myPos, setMyPos] = useState(null);
  
  // 검색 결과 임시 마커 좌표 및 제목
  const [searchedPos, setSearchedPos] = useState(null);
  const [searchedTitle, setSearchedTitle] = useState('');
  
  // 실제 선택(등록 대기) 중인 좌표
  const [selectedPos, setSelectedPos] = useState(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState('전체');
  const [isSorted, setIsSorted] = useState(false);
  const [formData, setFormData] = useState({ title: '', note: '', group: '기본' });

  // --- 2. 실시간 GPS 추적 ---
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(p => {
      setMyPos({ lat: p.coords.latitude, lng: p.coords.longitude });
    }, null, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // --- 3. 로컬 스토리지 동기화 ---
  useEffect(() => { 
    localStorage.setItem('geo_locations', JSON.stringify(locations)); 
  }, [locations]);

  // --- 4. 데이터 가공 (필터링 및 정렬) ---
  const groups = useMemo(() => ['전체', ...new Set(locations.map(l => l.group).filter(Boolean))], [locations]);
  
  const displayList = useMemo(() => {
    let list = activeGroup === '전체' ? [...locations] : locations.filter(l => l.group === activeGroup);
    return (isSorted && myPos) ? sortByNearest(myPos, list) : list;
  }, [locations, activeGroup, isSorted, myPos]);

  // 최단 경로 선(Polyline) 좌표 생성
  const routePath = useMemo(() => 
    (isSorted && myPos && displayList.length > 0) ? [myPos, ...displayList.map(l => ({ lat: l.lat, lng: l.lng }))] : [], 
  [isSorted, myPos, displayList]);

  // --- 5. 이벤트 핸들러 ---
  
  // 검색창에서 장소 선택 시
  const handlePlaceSelect = (pos, title) => {
    setSearchedPos(pos);
    setSearchedTitle(title);
    setIsPanelOpen(false); // 검색 시 일단 사이드바는 닫아둠 (지도 확인 우선)
  };

  // 저장 로직 (등록일시 포함)
  const handleSaveLocation = () => {
    if(!formData.title) return alert('제목을 입력해 주세요.');
    const newLocation = {
      ...formData,
      ...selectedPos,
      id: Date.now(),
      regDate: new Date().toLocaleString(), // 2026. 4. 7. 오전 10:24 형식
      isAlertEnabled: true
    };
    setLocations([newLocation, ...locations]);
    setSelectedPos(null);
    setSearchedPos(null);
    // 저장 후 목록을 보여주기 위해 패널 유지 (필요에 따라 닫아도 됨)
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden font-sans">
      <APIProvider apiKey={API_KEY}>
        <MapHandler targetPos={searchedPos} />
        
        {/* 중앙 상단 검색창 */}
        <div className="fixed top-4 inset-x-0 mx-auto z-[40] w-full max-w-[500px] px-16 md:px-0">
          <SearchBox onPlaceSelect={handlePlaceSelect} />
        </div>

        {/* 오른쪽 아래 내 위치 버튼 */}
        <CurrentLocationButton myPos={myPos} />

        {/* 지도 레이어 */}
        <div className="absolute inset-0 z-0">
          <Map 
            defaultCenter={{ lat: 37.5665, lng: 126.9780 }} 
            defaultZoom={14} 
            disableDefaultUI 
            onClick={e => {
              // 💡 핵심: 사이드바 바깥(지도) 클릭 시 처리
              if (isPanelOpen) {
                setIsPanelOpen(false);
                setSelectedPos(null);
                setSearchedPos(null);
              } else {
                // 사이드바가 닫혀 있을 때 클릭하면 신규 등록 폼 활성화
                setSelectedPos({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
                setFormData({ title: '', note: '', group: '기본' });
                setIsPanelOpen(true);
                setSearchedPos(null); 
              }
            }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* 내 위치 (파란 점) */}
            {myPos && <Marker position={myPos} zIndex={10} icon={{ path: 0, fillColor: '#3b82f6', fillOpacity: 1, strokeWeight: 3, strokeColor: '#ffffff', scale: 8 }} />}
            
            {/* 저장된 목적지들 */}
            {displayList.map(l => <Marker key={l.id} position={{ lat: l.lat, lng: l.lng }} />)}
            
            {/* 검색된 임시 마커 (클릭 시 저장 폼 활성화) */}
            {searchedPos && (
              <Marker 
                position={searchedPos} 
                zIndex={20}
                onClick={(e) => {
                  setSelectedPos(searchedPos);
                  setFormData(f => ({ ...f, title: searchedTitle }));
                  setIsPanelOpen(true);
                }}
              />
            )}

            {/* 현재 선택된(등록 중인) 마커 */}
            {selectedPos && <Marker position={selectedPos} zIndex={5} />}

            {/* 최단 경로 이동 선 */}
            {isSorted && routePath.length > 1 && (
              <Polyline path={routePath} strokeColor="#3b82f6" strokeOpacity={0.8} strokeWeight={4} />
            )}
          </Map>
        </div>

        {/* 메뉴 열기 버튼 (사이드바 닫혀있을 때만 노출) */}
        {!isPanelOpen && (
          <button 
            onClick={() => setIsPanelOpen(true)} 
            className="fixed top-4 left-4 z-[50] w-12 h-12 bg-white rounded-xl shadow-2xl flex items-center justify-center text-slate-800 border border-slate-100 active:scale-95 transition-all"
          >
            <Menu size={24} />
          </button>
        )}

        {/* 사이드바 컴포넌트 */}
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
          onToggleAlert={(id) => setLocations(locations.map(l => l.id === id ? {...l, isAlertEnabled: !l.isAlertEnabled} : l))} 
          onDelete={(id) => setLocations(locations.filter(l => l.id !== id))} 
          globalDistance={globalDistance} 
          setGlobalDistance={setGlobalDistance} 
        />
      </APIProvider>
    </div>
  );
}
