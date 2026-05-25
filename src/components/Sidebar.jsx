import React, { useState, useEffect } from 'react';
// 아이콘 import 목록을 명확히 확인하세요.
import { 
  X, Folder, MapPin, Bell, BellOff, Trash2, 
  ListOrdered, Navigation, LogOut, Clock, FileText 
} from 'lucide-react';
import { openExternalMap } from '../utils/mapLinks'; // 길찾기 로직 유틸

export default function Sidebar({ 
  isOpen, onClose, groups, activeGroup, setActiveGroup, 
  displayList, isSorted, setIsSorted, selectedPos, 
  formData, setFormData, onSave, onCancelSelection, 
  onToggleAlert, onDelete, 
  globalDistance, setGlobalDistance 
}) {
  const [confirmData, setConfirmData] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // 화면 크기 변화 감지 (데스크톱/모바일 레이아웃 강제 제어)
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFinalRedirect = (type, appName) => {
    if (!confirmData) return;
    
    // 최종 장면 전환 확인
    const isUserConfirmed = window.confirm(
      `🔔 GEO-PLANNER를 잠시 떠나 '${appName}' 앱(또는 웹)으로 이동하시겠습니까?`
    );

    if (isUserConfirmed) {
      openExternalMap(type, confirmData.lat, confirmData.lng, confirmData.title);
      setConfirmData(null);
    }
  };

  // 인라인 스타일로 레이아웃 고정
  const sidebarStyle = isDesktop ? {
    width: '420px', height: 'calc(100vh - 2rem)', top: '1rem', left: '1rem',
    borderRadius: '1.5rem', transform: isOpen ? 'translateX(0)' : 'translateX(-450px)',
  } : {
    width: '100%', height: '100%', top: 0, left: 0,
    borderRadius: 0, transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
  };

  return (
    <aside style={sidebarStyle} className="fixed z-[100] bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col overflow-hidden border border-slate-100 font-sans">
      
      {/* 1. 고정 헤더 (제목, 설정, 폴더 탭) */}
      <header className="p-6 bg-slate-900 text-white shrink-0">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl font-black text-cyan-400 italic tracking-tighter">GEO-PLANNER</h1>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
        </div>
        
        {/* 전역 알림 거리 설정 */}
        <div className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700 mb-4">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
            <span>Global Alert Range</span>
            <span className="text-cyan-400 font-black">{globalDistance}m</span>
          </div>
          <input 
            type="range" min="100" max="1000" step="100" 
            value={globalDistance} 
            onChange={(e) => setGlobalDistance(Number(e.target.value))} 
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
          />
        </div>

        {/* 폴더(그룹) 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {groups.map(g => (
            <button key={g} onClick={() => { setActiveGroup(g); setIsSorted(false); }} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${activeGroup === g ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
              <Folder size={12} className="inline mr-1.5" />{g}
            </button>
          ))}
        </div>
      </header>

      {/* 2. 스크롤 컨텐츠 영역 (등록 폼 + 목록) */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
        
        {/* 신규 위치 등록 폼 */}
        {selectedPos && (
          <div className="p-5 bg-white rounded-2xl border-2 border-cyan-100 space-y-3.5 shadow-sm animate-in zoom-in-95 duration-200">
            <div className="text-xs font-black text-cyan-600 uppercase flex items-center gap-2"><MapPin size={14}/> 신규 위치 등록</div>
            <input className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500" placeholder="위치 제목" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <textarea className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500 h-20 resize-none" placeholder="비고(메모)" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
            <input className="w-full p-3 bg-slate-50 border rounded-xl text-xs outline-none" placeholder="폴더명 지정" value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})} />
            <div className="flex gap-2 pt-2">
              <button onClick={onCancelSelection} className="flex-1 py-3 text-slate-400 font-bold text-sm hover:text-slate-600">취소</button>
              <button onClick={onSave} className="flex-[2] py-3 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 shadow-lg shadow-cyan-500/20">저장하기</button>
            </div>
          </div>
        )}

        {/* 목적지 목록 */}
        <div className="space-y-3 pb-20">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeGroup} ({displayList.length})</span>
            <button onClick={() => setIsSorted(!isSorted)} className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${isSorted ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-slate-500 border-slate-200'}`}>
              <ListOrdered size={14} /> 최단경로 {isSorted ? 'ON' : 'OFF'}
            </button>
          </div>

          {displayList.map((loc, idx) => (
            <div key={loc.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:border-cyan-200 group">
              {isSorted && <span className="w-7 h-7 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">{idx+1}</span>}
              
              {/* 제목 및 정보 영역 (길찾기 실행) */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setConfirmData(loc)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">{loc.group}</span>
                  <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-cyan-600 transition-colors">{loc.title}</h3>
                </div>
                {loc.note && (
                  <div className="flex items-start gap-1 text-[11px] text-slate-500">
                    <FileText size={12} className="mt-0.5 shrink-0" />
                    <p className="line-clamp-2 leading-relaxed">{loc.note}</p>
                  </div>
                )}
                <div className="text-[9px] text-slate-300 font-medium mt-1 flex items-center gap-1.5"><Clock size={10} /> {loc.regDate}</div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => onToggleAlert(loc.id)} className={`p-2.5 rounded-xl transition-colors ${loc.isAlertEnabled ? 'text-cyan-500 bg-cyan-50 hover:bg-cyan-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}>
                  {loc.isAlertEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                </button>
                <button onClick={() => onDelete(loc.id)} className="p-2.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🛡️ 개선된 길찾기 모달 (<div> 개별 감싸기 및 UI 통일) */}
      {confirmData && (
        <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            
            {/* 타이틀 및 목적지 정보 (스크린샷 참고) */}
            <div className="flex items-center gap-3 text-cyan-600 mb-6 pb-4 border-b border-slate-100 shrink-0">
              <Navigation size={24} className="shrink-0" />
              <div className="min-w-0 flex-1 text-left">
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">길 찾기 서비스 선택</h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate italic">to: {confirmData.title}</p>
              </div>
            </div>

            {/* ★ 뭉개짐 방지 및 UI 통일 버튼 리스트 */}
            <div className="flex flex-col gap-3.5 mb-8 flex-1 min-h-0">
              
              {/* 1. 네이버 지도 구역 (스크린샷 복구 완료) */}
              <div className="w-full h-14 bg-white border-slate-200 rounded-xl flex items-center shadow-lg shadow-slate-200/50">
                <button 
                  onClick={() => handleFinalRedirect('naver', '네이버 지도')} 
                  className="flex items-center w-full min-h-[56px] px-6 rounded-full font-bold active:scale-[0.98] transition-all"
                >
                  {/* 왼쪽 아이콘 */}
                  <Navigation size={20} className="shrink-0 mr-4 text-[#03C75A]" />
                  {/* 중앙 텍스트 (찌그러짐 방지, text-center) */}
                  <span className="flex-1 text-center text-[15px] font-bold text-slate-800 leading-tight">네이버 지도로 열기</span>
                  {/* 오른쪽 dummy (중앙 정렬용) */}
                  <div className="shrink-0 ml-2 w-5" />
                </button>
              </div>
              
              {/* 2. 카카오 맵 구역 (스크린샷 디자인 수정) */}
              <div className="w-full h-14 bg-white border-slate-200 rounded-xl flex items-center shadow-lg shadow-slate-200/50">
                <button 
                  onClick={() => handleFinalRedirect('kakao', '카카오 맵')} 
                  className="flex items-center w-full min-h-[56px] px-6 rounded-full font-bold active:scale-[0.98] transition-all"
                >
                  <Navigation size={20} className="shrink-0 mr-4 text-[#FAE100]" />
                  <span className="flex-1 text-center text-[15px] font-bold text-slate-800 leading-tight">카카오 맵으로 길 찾기</span>
                  <div className="shrink-0 ml-2 w-5" />
                </button>
              </div>
              
              {/* 3. 구글 맵 구역 (스크린샷 UI 완전 통일) */}
              <div className="w-full h-14 bg-white border-slate-200 rounded-xl flex items-center shadow-lg shadow-slate-200/50">
                <button 
                  onClick={() => handleFinalRedirect('google', 'Google Maps')} 
                  className="flex items-center w-full min-h-[56px] px-6 rounded-full font-bold active:scale-[0.98] transition-all hover:border-slate-300"
                >
                  <LogOut size={20} className="shrink-0 mr-4 text-slate-400 group-hover:text-slate-600" />
                  <span className="flex-1 text-center text-[15px] font-bold text-slate-800 leading-tight">Google Maps 이용</span>
                  <div className="shrink-0 ml-2 w-5" />
                </button>
              </div>
            </div>

            {/* 파란색 '닫기' 버튼 (스크린샷 참고) */}
            <button 
              onClick={() => setConfirmData(null)} 
              className="w-full py-2.5 text-cyan-500 font-bold text-sm text-center hover:text-cyan-600 transition-colors shrink-0"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
