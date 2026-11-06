import {nextAllowedDay} from './date';import type {Recurrence,Weekday} from './types';
export const DAILY:Weekday[]=[0,1,2,3,4,5,6],WORKDAYS:Weekday[]=[1,2,3,4,5],WEEKEND:Weekday[]=[0,6];
export function normalizeWeekdays(values:number[]):Weekday[]{return [...new Set(values)].filter(v=>Number.isInteger(v)&&v>=0&&v<=6).sort((a,b)=>a-b) as Weekday[]}
export function recurrence(values:number[]):Recurrence|null{const weekdays=normalizeWeekdays(values);return weekdays.length?{kind:'weekdays',weekdays}:null}
export function nextOccurrence(after:string,rule:Recurrence):string{return nextAllowedDay(after,rule.weekdays)}
export function recurrenceLabel(rule:Recurrence):string{const d=normalizeWeekdays(rule.weekdays);if(d.join()==DAILY.join())return'Jeden Tag';if(d.join()==WORKDAYS.join())return'Jeden Wochentag';if(d.join()==WEEKEND.join())return'Jedes Wochenende';const n=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];if(d.length===1)return'Jeden '+n[d[0]];return'Jeden '+d.map(x=>n[x]).slice(0,-1).join(', ')+' und '+n[d.at(-1)!]}
