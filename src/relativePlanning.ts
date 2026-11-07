import { addDays, isValidDate } from './date';
import type { Subtask, SubtaskOffset } from './types';

const numbers: Record<string, number> = {
 'ein':1,'eine':1,'einen':1,'einem':1,'einer':1,
 'zwei':2,'drei':3,'vier':4,'fünf':5,'fuenf':5,'sechs':6,
 'sieben':7,'acht':8,'neun':9,'zehn':10,'elf':11,'zwölf':12,'zwoelf':12
};
const numeral = '(\\d{1,3}|ein|eine|einen|einem|einer|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf)';
const unit = '(Tag(?:e|en)?|Woche(?:n)?|Monat(?:e|en)?)';
const suffix = '(?:\\s*[–—-]\\s*|\\s+)';
const trailingBefore = new RegExp(suffix + numeral + '\\s+' + unit + '\\s+(?:vorher|vor\\s+(?:der\\s+)?\\{Deadline\\})\\s*$', 'iu');
const trailingAnchor = new RegExp(suffix + '\\{Deadline\\}\\s*[-−]\\s*' + numeral + '\\s+' + unit + '\\s*$', 'iu');
const trailingYesterday = new RegExp(suffix + '(?:am\\s+)?Vortag\\s*$', 'iu');

export function offsetDescription(offset: SubtaskOffset): string {
 const { amount, unit } = offset;
 const label = unit === 'days' ? amount === 1 ? 'Tag' : 'Tage'
   : unit === 'weeks' ? amount === 1 ? 'Woche' : 'Wochen'
   : amount === 1 ? 'Monat' : 'Monate';
 return `${amount} ${label} vor Deadline`;
}

export function parseRelativeStep(text: string): { title: string; offset: SubtaskOffset | null } {
 const raw = text.trim();
 if (!raw) return { title: '', offset: null };
 if (trailingYesterday.test(raw)) {
  const title=raw.replace(trailingYesterday,'').trim();
  if (title) return {title,offset:{amount:1,unit:'days'}};
 }
 for (const pattern of [trailingBefore,trailingAnchor]) {
  const match=raw.match(pattern);
  if (!match) continue;
  const title=raw.slice(0,match.index).trim();
  const amount=Number.isNaN(Number(match[1]))?numbers[match[1].toLowerCase()]:Number(match[1]);
  if (!title||!Number.isInteger(amount)||amount<1||amount>999)break;
  const writtenUnit=match[2].toLowerCase();
  const unit:SubtaskOffset['unit'] = writtenUnit.startsWith('tag')?'days':
    writtenUnit.startsWith('woch')?'weeks':'months';
  return {title,offset:{amount,unit}};
 }
 return {title:raw,offset:null};
}

/** Calendar arithmetic in UTC local-day labels; subtracting months clamps month ends. */
export function dateBeforeDeadline(deadline:string,offset:SubtaskOffset):string {
 if (!isValidDate(deadline)) throw new Error('Ungültige Deadline.');
 if (!Number.isInteger(offset.amount)||offset.amount<1||offset.amount>999)
  throw new Error('Der Zeitabstand muss zwischen 1 und 999 liegen.');
 if (offset.unit==='days') return addDays(deadline,-offset.amount);
 if (offset.unit==='weeks') return addDays(deadline,-offset.amount*7);
 const [year,month,day]=deadline.split('-').map(Number);
 const total=year*12+month-1-offset.amount;
 const y=Math.floor(total/12),m=(total%12+12)%12;
 const lastDay=new Date(Date.UTC(y,m+1,0)).getUTCDate();
 return new Date(Date.UTC(y,m,Math.min(day,lastDay))).toISOString().slice(0,10);
}

export function resolveRelativeSubtasks(subtasks:Subtask[],deadline:string|null):Subtask[] {
 return subtasks.map(step=>step.offset && !step.completed
  ? {...step,plannedDate:deadline?dateBeforeDeadline(deadline,step.offset):null}
  : step);
}

export function parseAndResolveStep(text:string,deadline:string|null):Pick<Subtask,'title'|'offset'|'plannedDate'> {
 const parsed=parseRelativeStep(text);
 return {title:parsed.title,offset:parsed.offset??undefined,
  plannedDate:parsed.offset&&deadline?dateBeforeDeadline(deadline,parsed.offset):null};
}

export function deadlineWorkday(deadline:string):string {
 return addDays(deadline,-1);
}

export function templateStepFromSubtask(step:Subtask):string {
 if (!step.offset) return step.title;
 const singular=step.offset.unit==='days'?'Tage':step.offset.unit==='weeks'?'Wochen':'Monate';
 return `${step.title} – {Deadline} - ${step.offset.amount} ${singular}`;
}
