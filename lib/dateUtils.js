export function localDateKey(date=new Date()){
  const d=new Date(date);
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
export function localDateTime(dateKey,time){
  return new Date(`${dateKey}T${time}:00`);
}
export function localNowIso(){return new Date().toISOString();}
