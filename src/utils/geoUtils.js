// 하버사인 거리 계산 (m)
export const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// 최단 경로 정렬 (Greedy)
export const sortByNearest = (currentPos, list) => {
  let sorted = [], curr = currentPos, rem = [...list];
  while (rem.length > 0) {
    rem.sort((a, b) => getDistance(curr.lat, curr.lng, a.lat, a.lng) - getDistance(curr.lat, curr.lng, b.lat, b.lng));
    const next = rem.shift(); sorted.push(next); curr = { lat: next.lat, lng: next.lng };
  }
  return sorted;
};
