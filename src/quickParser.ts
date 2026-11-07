import {addDays,isValidDate,nextAllowedDay,weekday} from './date';import {DAILY,WEEKEND,WORKDAYS,recurrence,intervalRecurrence,firstOccurrence} from './recurrence';import type {Priority,Recurrence,Weekday} from './types';
export interface QuickTaskResult{title:string;priority:Priority;scheduledDate:string|null;deadlineDate:string|null;recurrence:Recurrence|null}
const dayMap:Record<string,Weekday>={sonntag:0,so:0,montag:1,mo:1,dienstag:2,di:2,mittwoch:3,mi:3,donnerstag:4,do:4,freitag:5,fr:5,samstag:6,sa:6};
const DAY='(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)';
function nextNamed(reference:string,value:string):string|null{const target=dayMap[value.toLowerCase()];if(target===undefined)return null;return nextAllowedDay(reference,[target],true)}
function calendarDate(reference:string,value:string):string|null{const m=value.match(/^(\d{1,2})\.(\d{1,2})\.(?:(\d{4}))?$/);if(!m)return null;const [,ds,ms,ys]=m;let year=ys?Number(ys):Number(reference.slice(0,4));let candidate=`${year}-${ms.padStart(2,'0')}-${ds.padStart(2,'0')}`;if(!isValidDate(candidate))return null;if(!ys&&candidate<reference){year++;candidate=`${year}-${ms.padStart(2,'0')}-${ds.padStart(2,'0')}`;if(!isValidDate(candidate))return null}return candidate}
function parseDate(reference:string,value:string){if(value.toLowerCase()==='heute')return reference;if(value.toLowerCase()==='morgen')return addDays(reference,1);return calendarDate(reference,value)||nextNamed(reference,value)}
const spelled:Record<string,number>={ein:1,eine:1,zwei:2,drei:3,vier:4,fünf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10,elf:11,zwölf:12};
function monthlyAnchor(day:number,reference:string):string|null {
 if(!Number.isInteger(day)||day<1||day>31)return null;
 const [year,month]=reference.split('-').map(Number);
 // For e.g. a 31st-day recurrence in November, anchor October 31 so that
 // November 30 is a clamped occurrence and December returns to the 31st.
 for(let offset=0;offset<12;offset++){
  const index=year*12+month-1-offset;
  const y=Math.floor(index/12),m=index%12+1;
  const candidate=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  if(isValidDate(candidate))return candidate;
 }
 return null;
}
export function parseQuickTask(input:string,referenceDate:string):QuickTaskResult{
 let priority:Priority=4,scheduledDate:string|null=null,deadlineDate:string|null=null,rule:Recurrence|null=null;const spans:Array<[number,number]>=[];
 const take=(m:RegExpExecArray)=>spans.push([m.index,m.index+m[0].length]);
 // Priority shortcuts must also work before punctuation, not just before whitespace.
 const priorityRe=/(?:^|[\s,;:([{])#p([1-4])(?=$|[\s.,;:!?)}\]])/gi;let match:RegExpExecArray|null;const priorities:RegExpExecArray[]=[];while((match=priorityRe.exec(input)))priorities.push(match);if(priorities.length&&new Set(priorities.map(m=>m[1])).size===1){priority=Number(priorities[0][1]) as Priority;priorities.forEach(take)}
 const intervalRe=/\balle\s+(\d{1,3}|ein|eine|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\s+(Tag(?:e|en)?|Woche(?:n)?|Monat(?:e|en)?)\b/iu;
 const intervalMatch=intervalRe.exec(input);
 const monthlyPhrase=/\b(?:jeden\s+Monat|monatlich)\b/iu.exec(input);
 let intervalSpec:{every:number;unit:'days'|'weeks'|'months'}|null=null;
 if(intervalMatch){
  const written=intervalMatch[1].toLowerCase();
  const every=Number.isNaN(Number(written))?spelled[written]:Number(written);
  const unitText=intervalMatch[2].toLowerCase();
  const unit=unitText.startsWith('tag')?'days':unitText.startsWith('woch')?'weeks':'months';
  if(Number.isInteger(every)&&every>=1&&every<=999){
   intervalSpec={every,unit};
   take(intervalMatch);
  }
 }else if(monthlyPhrase){
  intervalSpec={every:1,unit:'months'};
  take(monthlyPhrase);
 }
 const presets=[{re:/\bjeden\s+Tag\b/i,days:DAILY},{re:/\bjeden\s+(?:Wochen|Schul)tag\b/i,days:WORKDAYS},{re:/\bjedes\s+Wochenende\b/i,days:WEEKEND}];
 if(!intervalSpec)for(const preset of presets){const m=preset.re.exec(input);if(m){rule=recurrence(preset.days);take(m);break}}
 if(!rule&&!intervalSpec){const re=new RegExp(`\\bjeden\\s+(${DAY}(?:\\s*(?:,|und)\\s*${DAY})*)\\b`,'i');const m=re.exec(input);if(m){const found=m[1].match(new RegExp(DAY,'gi'))!.map(x=>dayMap[x.toLowerCase()]);rule=recurrence(found);take(m)}}
 const deadlineRe=new RegExp(`\\bbis(?:\\s+zum)?\\s+(${DAY}|\\d{1,2}\\.\\d{1,2}\\.(?:\\d{4})?)(?=\\s|$)`,'i');const deadline=deadlineRe.exec(input);if(deadline){const parsed=parseDate(referenceDate,deadline[1]);if(parsed){deadlineDate=parsed;take(deadline)}}
 const scheduleRe=new RegExp(`(?:\\bam\\s+(${DAY}|\\d{1,2}\\.\\d{1,2}\\.(?:\\d{4})?)|\\b(heute|morgen))(?=\\s|$)`,'i');const schedule=scheduleRe.exec(input);if(schedule){const parsed=parseDate(referenceDate,schedule[1]||schedule[2]);if(parsed){scheduledDate=parsed;take(schedule)}}
 if(intervalSpec){
  let anchor=scheduledDate??referenceDate;
  if(intervalSpec.unit==='months'&&!scheduledDate){
   const md=/\bam\s+(\d{1,2})\.(?!\d)/iu.exec(input);
   if(md){
    const monthly=monthlyAnchor(Number(md[1]),referenceDate);
    if(monthly){anchor=monthly;take(md)}
   }
  }
  rule=intervalRecurrence(intervalSpec.every,intervalSpec.unit,anchor);
  if(!scheduledDate)scheduledDate=firstOccurrence(referenceDate,rule);
 }
 if(rule&&!scheduledDate&&rule.kind==='weekdays')scheduledDate=nextAllowedDay(referenceDate,rule.weekdays,true);
 const title=spans.sort((a,b)=>b[0]-a[0]).reduce((text,[start,end])=>text.slice(0,start)+text.slice(end),input).replace(/\s+/g,' ').trim();
 return{title,priority,scheduledDate,deadlineDate,recurrence:rule};
}
