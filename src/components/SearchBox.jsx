import React, { useState, useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search, MapPin } from 'lucide-react'; // 리스트 아이콘을 위해 MapPin 추가

export default function SearchBox({ onPlaceSelect }) {
  const map = useMap();
  
  // 1. 구글 Places 라이브러리 및 서비스 연결
  const placesLib = useMapsLibrary('places');
  const [placesService, setPlacesService] = useState(null);

  // 2. 검색 입력값과 검색 결과 리스트 상태(State) 관리
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (placesLib && map) {
      setPlacesService(new placesLib.PlacesService(map));
    }
  }, [placesLib, map]);

  // 엔터 키를 누르면 Places API로 다중 검색 결과를 가져옴
  const handleSearch = (e) => {
    if (e.key === 'Enter' && placesService && placesLib) {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      placesService.textSearch({ query: trimmedQuery }, (res, status) => {
        if (status === placesLib.PlacesServiceStatus.OK && res) {
          // 검색된 여러 개의 장소 목록을 상태에 저장
          setResults(res);
        } else {
          alert('장소를 찾을 수 없습니다. 검색어를 정확하게 입력해 주세요.');
          setResults([]);
        }
      });
    }
  };

  // 사용자가 리스트에서 특정 장소를 클릭했을 때 실행되는 함수
  const handleSelectPlace = (place) => {
    if (!place.geometry || !place.geometry.location) return;

    const pos = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    };

    // 지도 이동 및 줌 설정
    map?.panTo(pos);
    map?.setZoom(16);

    // 부모 컴포넌트에 좌표와 실제 장소명 전달
    onPlaceSelect(pos, place.name || query);

    // 검색창 초기화 및 리스트 닫기
    setResults([]);
    setQuery('');
  };

  // 입력창 글자를 다 지우면 결과 리스트도 닫히도록 처리
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
    }
  };

  return (
    <div className="absolute top-4 left-[72px] right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-[40] flex flex-col gap-1.5">
      {/* 검색 입력창 */}
      <div className="flex items-center bg-white/95 backdrop-blur shadow-2xl border border-slate-200 px-4 py-3 rounded-2xl">
        <Search size={18} className="text-slate-400 mr-2 shrink-0" />
        <input
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleSearch}
          className="w-full outline-none text-sm font-bold bg-transparent"
          placeholder="장소명, 브랜드 또는 주소 검색 (Enter)"
        />
      </div>

      {/* 검색 결과 목록 드롭다운 (결과가 있을 때만 렌더링) */}
      {results.length > 0 && (
        <ul className="max-h-[280px] overflow-y-auto bg-white/95 backdrop-blur border border-slate-200 shadow-2xl rounded-2xl py-1.5 flex flex-col divide-y divide-slate-100">
          {results.map((place) => (
            <li
              key={place.place_id}
              onClick={() => handleSelectPlace(place)}
              className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 transition-colors"
            >
              {/* 장소 아이콘 */}
              <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
              
              <div className="flex flex-col min-w-0">
                {/* 상호명 (예: 아우어베이커리 방배점) */}
                <span className="text-sm font-bold text-slate-800 truncate">
                  {place.name}
                </span>
                {/* 상세 주소 (예: 서울특별시 서초구 방배로...) */}
                <span className="text-xs text-slate-500 mt-0.5 truncate">
                  {place.formatted_address}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
