import type { Weekday } from './types';
export const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
export function todayLocal(now=new Date()):string { return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function addDays(date:string,days:number):string { const [y,m,d]=date.split('-').map(Number); const value=new Date(Date.UTC(y,m-1,d+days)); return value.toISOString().slice(0,10); }
export function weekday(date:string):Weekday { const [y,m,d]=date.split('-').map(Number); return new Date(Date.UTC(y,m-1,d)).getUTCDay() as Weekday; }
export function nextWeekday(after:string,target:Weekday):string { const delta=((target-weekday(after)+7)%7)||7; return addDays(after,delta); }
export function nextAllowedDay(after:string,allowed:Weekday[],includeStart=false):string {for(let offset=includeStart?0:1;offset<=7;offset++){const candidate=addDays(after,offset);if(allowed.includes(weekday(candidate)))return candidate}throw new Error('Eine Wiederholung benötigt mindestens einen Wochentag.')}
export function isValidDate(date:string):boolean {if(!DATE_RE.test(date))return false;const [y,m,d]=date.split('-').map(Number);const value=new Date(Date.UTC(y,m-1,d));return value.getUTCFullYear()===y&&value.getUTCMonth()===m-1&&value.getUTCDate()===d}
export function formatDate(date:string):string { const [y,m,d]=date.split('-').map(Number); return new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'short',timeZone:'Europe/Berlin'}).format(new Date(Date.UTC(y,m-1,d,12))); }
export const weekdayNames=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
export const weekdayShort=['So','Mo','Di','Mi','Do','Fr','Sa'];
