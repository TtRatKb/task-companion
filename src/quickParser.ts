import {addDays,isValidDate,nextAllowedDay,weekday} from './date';import {DAILY,WEEKEND,WORKDAYS,recurrence} from './recurrence';import type {Priority,Recurrence,Weekday} from './types';
export interface QuickTaskResult{title:string;priority:Priority;scheduledDate:string|null;deadlineDate:string|null;recurrence:Recurrence|null}
const dayMap:Record<string,Weekday>={sonntag:0,so:0,montag:1,mo:1,dienstag:2,di:2,mittwoch:3,mi:3,donnerstag:4,do:4,freitag:5,fr:5,samstag:6,sa:6};
const DAY='(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)';
function nextNamed(reference:string,value:string):string|null{const target=dayMap[value.toLowerCase()];if(target===undefined)return null;return nextAllowedDay(reference,[target],true)}
function calendarDate(reference:string,value:string):string|null{const m=value.match(/^(\d{1,2})\.(\d{1,2})\.(?:(\d{4}))?$/);if(!m)return null;const [,ds,ms,ys]=m;let year=ys?Number(ys):Number(reference.slice(0,4));let candidate=`${year}-${ms.padStart(2,'0')}-${ds.padStart(2,'0')}`;if(!isValidDate(candidate))return null;if(!ys&&candidate<reference){year++;candidate=`${year}-${ms.padStart(2,'0')}-${ds.padStart(2,'0')}`;if(!isValidDate(candidate))return null}return candidate}
function parseDate(reference:string,value:string){if(value.toLowerCase()==='heute')return reference;if(value.toLowerCase()==='morgen')return addDays(reference,1);return calendarDate(reference,value)||nextNamed(reference,value)}
export function parseQuickTask(input:string,referenceDate:string):QuickTaskResult{
 let priority:Priority=4,scheduledDate:string|null=null,deadlineDate:string|null=null,rule:Recurrence|null=null;const spans:Array<[number,number]>=[];
 const take=(m:RegExpExecArray)=>spans.push([m.index,m.index+m[0].length]);
 const priorityRe=/(?:^|\s)#p([1-4])(?=\s|$)/ig;let match:RegExpExecArray|null;const priorities:RegExpExecArray[]=[];while((match=priorityRe.exec(input)))priorities.push(match);if(priorities.length&&new Set(priorities.map(m=>m[1])).size===1){priority=Number(priorities[0][1]) as Priority;priorities.forEach(take)}
 const presets=[{re:/\bjeden\s+Tag\b/i,days:DAILY},{re:/\bjeden\s+(?:Wochen|Schul)tag\b/i,days:WORKDAYS},{re:/\bjedes\s+Wochenende\b/i,days:WEEKEND}];
 for(const preset of presets){const m=preset.re.exec(input);if(m){rule=recurrence(preset.days);take(m);break}}
 if(!rule){const re=new RegExp(`\\bjeden\\s+(${DAY}(?:\\s*(?:,|und)\\s*${DAY})*)\\b`,'i');const m=re.exec(input);if(m){const found=m[1].match(new RegExp(DAY,'gi'))!.map(x=>dayMap[x.toLowerCase()]);rule=recurrence(found);take(m)}}
 const deadlineRe=new RegExp(`\\bbis(?:\\s+zum)?\\s+(${DAY}|\\d{1,2}\\.\\d{1,2}\\.(?:\\d{4})?)(?=\\s|$)`,'i');const deadline=deadlineRe.exec(input);if(deadline){const parsed=parseDate(referenceDate,deadline[1]);if(parsed){deadlineDate=parsed;take(deadline)}}
 const scheduleRe=new RegExp(`(?:\\bam\\s+(${DAY}|\\d{1,2}\\.\\d{1,2}\\.(?:\\d{4})?)|\\b(heute|morgen))(?=\\s|$)`,'i');const schedule=scheduleRe.exec(input);if(schedule){const parsed=parseDate(referenceDate,schedule[1]||schedule[2]);if(parsed){scheduledDate=parsed;take(schedule)}}
 if(rule&&!scheduledDate)scheduledDate=nextAllowedDay(referenceDate,rule.weekdays,true);
 const title=spans.sort((a,b)=>b[0]-a[0]).reduce((text,[start,end])=>text.slice(0,start)+text.slice(end),input).replace(/\s+/g,' ').trim();
 return{title,priority,scheduledDate,deadlineDate,recurrence:rule};
}
