import type { Weekday } from './types';
export const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
export function todayLocal(now=new Date()):string { return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function addDays(date:string,days:number):string { const [y,m,d]=date.split('-').map(Number); const value=new Date(Date.UTC(y,m-1,d+days)); return value.toISOString().slice(0,10); }
export function weekday(date:string):Weekday { const [y,m,d]=date.split('-').map(Number); return new Date(Date.UTC(y,m-1,d)).getUTCDay() as Weekday; }
export function nextWeekday(after:string,target:Weekday):string { const delta=((target-weekday(after)+7)%7)||7; return addDays(after,delta); }
export function formatDate(date:string):string { const [y,m,d]=date.split('-').map(Number); return new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'short',timeZone:'Europe/Berlin'}).format(new Date(Date.UTC(y,m-1,d,12))); }
export const weekdayNames=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
