import {addDays,isValidDate,nextAllowedDay} from './date';
import type {Recurrence,Weekday} from './types';

export const DAILY:Weekday[]=[0,1,2,3,4,5,6],WORKDAYS:Weekday[]=[1,2,3,4,5],WEEKEND:Weekday[]=[0,6];

export function normalizeWeekdays(values:number[]):Weekday[]{
 return [...new Set(values)].filter(v=>Number.isInteger(v)&&v>=0&&v<=6).sort((a,b)=>a-b) as Weekday[];
}
export function recurrence(values:number[]):Recurrence|null{
 const weekdays=normalizeWeekdays(values);
 return weekdays.length?{kind:'weekdays',weekdays}:null;
}
export function intervalRecurrence(every:number,unit:'days'|'weeks'|'months',anchorDate:string):Recurrence {
 if(!Number.isInteger(every)||every<1||every>999||!['days','weeks','months'].includes(unit)||!isValidDate(anchorDate))
  throw new Error('Ungültige Wiederholung: Abstand und Startdatum prüfen.');
 return {kind:'interval',every,unit,anchorDate};
}
function dayValue(date:string):number {
 const [year,month,day]=date.split('-').map(Number);
 return Math.floor(Date.UTC(year,month-1,day)/86_400_000);
}
function anchoredMonth(date:string,months:number):string {
 const [year,month,day]=date.split('-').map(Number);
 const index=year*12+month-1+months;
 const targetYear=Math.floor(index/12);
 const targetMonth=((index%12)+12)%12;
 const lastDay=new Date(Date.UTC(targetYear,targetMonth+1,0)).getUTCDate();
 return new Date(Date.UTC(targetYear,targetMonth,Math.min(day,lastDay),12)).toISOString().slice(0,10);
}

/** Calendar-based recurrence, anchored to its original start day (so Jan 31 -> Feb 28 -> Mar 31).
 * Uses the existing chosen calendar dates, not completion-time intervals.
 * Missed occurrences are skipped rather than creating a backlog.
 */
export function nextOccurrence(after:string,rule:Recurrence):string {
 if(rule.kind==='weekdays')return nextAllowedDay(after,rule.weekdays);
 if(!isValidDate(after)||!isValidDate(rule.anchorDate)||!Number.isInteger(rule.every)||
    rule.every<1||rule.every>999)throw new Error('Ungültige Wiederholung.');
 if(after<rule.anchorDate)return rule.anchorDate;
 if(rule.unit==='days'||rule.unit==='weeks'){
  const step=rule.every*(rule.unit==='weeks'?7:1);
  const count=Math.floor((dayValue(after)-dayValue(rule.anchorDate))/step)+1;
  return addDays(rule.anchorDate,step*count);
 }
 const [y1,m1]=rule.anchorDate.split('-').map(Number);
 const [y2,m2]=after.split('-').map(Number);
 const months=Math.max(0,(y2-y1)*12+m2-m1);
 let count=Math.floor(months/rule.every);
 let next=anchoredMonth(rule.anchorDate,count*rule.every);
 if(next<=after)next=anchoredMonth(rule.anchorDate,(count+1)*rule.every);
 return next;
}
export function firstOccurrence(onOrAfter:string,rule:Recurrence):string {
 if(rule.kind==='interval')return onOrAfter<=rule.anchorDate?rule.anchorDate:nextOccurrence(addDays(onOrAfter,-1),rule);
 return nextAllowedDay(onOrAfter,rule.weekdays,true);
}
export function recurrenceLabel(rule:Recurrence):string {
 if(rule.kind==='interval'){
  if(rule.unit==='days')return rule.every===1?'Jeden Tag':`Alle ${rule.every} Tage`;
  if(rule.unit==='weeks')return rule.every===1?'Jede Woche':`Alle ${rule.every} Wochen`;
  return rule.every===1?'Jeden Monat':`Alle ${rule.every} Monate`;
 }
 const d=normalizeWeekdays(rule.weekdays);
 if(d.join()==DAILY.join())return'Jeden Tag';
 if(d.join()==WORKDAYS.join())return'Jeden Wochentag';
 if(d.join()==WEEKEND.join())return'Jedes Wochenende';
 const n=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
 if(d.length===1)return'Jeden '+n[d[0]];
 return'Jeden '+d.map(x=>n[x]).slice(0,-1).join(', ')+' und '+n[d.at(-1)!];
}
