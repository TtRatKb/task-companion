import {addDays,isValidDate} from './date';
import type {Subtask,SubtaskOffset,TaskTemplate} from './types';

const numbers:Record<string,number>={
 'ein':1,'eine':1,'einen':1,'einem':1,'einer':1,
 'zwei':2,'drei':3,'vier':4,'fünf':5,'fuenf':5,'sechs':6,
 'sieben':7,'acht':8,'neun':9,'zehn':10,'elf':11,'zwölf':12,'zwoelf':12
};
const numeral='(\\d{1,3}|ein|eine|einen|einem|einer|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf)';
const unit='(Tag(?:e|en)?|Woche(?:n)?|Monat(?:e|en)?)';
const suffix='(?:\\s*[–—-]\\s*|\\s+)';
const trailingBefore=new RegExp(suffix+numeral+'\\s+'+unit+'\\s+(?:vorher|vor\\s+(?:der\\s+)?\\{Deadline\\})\\s*$','iu');
const trailingMinus=new RegExp(suffix+'\\{Deadline\\}\\s*[-−]\\s*'+numeral+'\\s+'+unit+'\\s*$','iu');
const trailingAfter=new RegExp(suffix+'(?:bis\\s+)?'+numeral+'\\s+'+unit+'\\s+(?:danach|nach\\s+(?:der\\s+)?\\{Deadline\\})\\s*$','iu');
const trailingPlus=new RegExp(suffix+'\\{Deadline\\}\\s*\\+\\s*'+numeral+'\\s+'+unit+'\\s*$','iu');
const trailingOn=new RegExp(suffix+'(?:am|an)\\s+\\{Deadline\\}\\s*$','iu');
const trailingYesterday=new RegExp(suffix+'(?:am\\s+)?Vortag\\s*$','iu');
const trailingTomorrow=new RegExp(suffix+'(?:am\\s+)?(?:Folgetag|Tag\\s+danach)\\s*$','iu');

const unitLabel=(offset:SubtaskOffset)=>{
 const {amount,unit}=offset;
 return unit==='days'?(amount===1?'Tag':'Tage'):unit==='weeks'?(amount===1?'Woche':'Wochen'):(amount===1?'Monat':'Monate');
};
export function offsetDescription(offset:SubtaskOffset,anchor='Deadline'):string {
 if(offset.direction==='on')return anchor==='Deadline'?'Am Deadline-Tag':`Am ${anchor}`;
 return `${offset.amount} ${unitLabel(offset)} ${offset.direction==='after'?'nach':'vor'} ${anchor}`;
}
const offsetFrom=(match:RegExpMatchArray,direction?:'after'):SubtaskOffset|null=>{
 const amount=Number.isNaN(Number(match[1]))?numbers[match[1].toLowerCase()]:Number(match[1]);
 if(!Number.isInteger(amount)||amount<1||amount>999)return null;
 const written=match[2].toLowerCase();
 const unit:SubtaskOffset['unit']=written.startsWith('tag')?'days':written.startsWith('woch')?'weeks':'months';
 return {amount,unit,...(direction?{direction}:{})};
};
export function parseRelativeStep(text:string):{title:string;offset:SubtaskOffset|null}{
 const raw=text.trim();
 if(!raw)return {title:'',offset:null};
 for(const [pattern,offset] of [
  [trailingYesterday,{amount:1,unit:'days'}],
  [trailingTomorrow,{amount:1,unit:'days',direction:'after'}],
  [trailingOn,{amount:0,unit:'days',direction:'on'}]
 ] as const){
  const match=raw.match(pattern);
  if(match){
   const title=raw.slice(0,match.index).trim();
   if(title)return {title,offset:{...offset} as SubtaskOffset};
  }
 }
 for(const [pattern,direction] of [
  [trailingBefore,undefined],[trailingMinus,undefined],[trailingAfter,'after'],[trailingPlus,'after']
 ] as const){
  const match=raw.match(pattern);
  if(!match)continue;
  const title=raw.slice(0,match.index).trim();
  const offset=offsetFrom(match,direction);
  if(title&&offset)return {title,offset};
 }
 return {title:raw,offset:null};
}

/** Calendar days are stable across DST; months clamp to a valid month-end in both directions. */
export function dateRelativeToAnchor(anchor:string,offset:SubtaskOffset):string{
 if(!isValidDate(anchor))throw new Error('Ungültiges Bezugsdatum.');
 if(offset.direction==='on'){
  if(offset.amount!==0||offset.unit!=='days')throw new Error('Am Bezugsdatum muss der Abstand null sein.');
  return anchor;
 }
 if(!Number.isInteger(offset.amount)||offset.amount<1||offset.amount>999)
  throw new Error('Der Zeitabstand muss zwischen 1 und 999 liegen.');
 const sign=offset.direction==='after'?1:-1;
 if(offset.unit==='days')return addDays(anchor,sign*offset.amount);
 if(offset.unit==='weeks')return addDays(anchor,sign*offset.amount*7);
 const [year,month,day]=anchor.split('-').map(Number);
 const total=year*12+month-1+sign*offset.amount;
 const y=Math.floor(total/12),m=(total%12+12)%12;
 const lastDay=new Date(Date.UTC(y,m+1,0)).getUTCDate();
 return new Date(Date.UTC(y,m,Math.min(day,lastDay))).toISOString().slice(0,10);
}
/** Backward-compatible API for existing strictly pre-deadline steps. */
export function dateBeforeDeadline(deadline:string,offset:SubtaskOffset):string{
 return dateRelativeToAnchor(deadline,offset);
}
export function resolveRelativeSubtasks(subtasks:Subtask[],anchor:string|null):Subtask[]{
 return subtasks.map(step=>step.offset&&!step.completed
  ?{...step,plannedDate:anchor?dateRelativeToAnchor(anchor,step.offset):null}
  :step);
}
export function parseAndResolveStep(text:string,anchor:string|null):Pick<Subtask,'title'|'offset'|'plannedDate'>{
 const parsed=parseRelativeStep(text);
 return {title:parsed.title,offset:parsed.offset??undefined,
  plannedDate:parsed.offset&&anchor?dateRelativeToAnchor(anchor,parsed.offset):null};
}
export function deadlineWorkday(deadline:string):string{return addDays(deadline,-1)}
export function templateStepFromSubtask(step:Subtask):string{
 if(!step.offset)return step.title;
 if(step.offset.direction==='on')return `${step.title} – am {Deadline}`;
 const plural=unitLabel(step.offset);
 return `${step.title} – {Deadline} ${step.offset.direction==='after'?'+':'-'} ${step.offset.amount} ${plural}`;
}
/** Old templates with explicit post-event steps become events without changing saved templates. */
export function templateAnchorKind(template:Pick<TaskTemplate,'anchorKind'|'steps'>):'event'|'deadline' {
 if(template.anchorKind)return template.anchorKind;
 return template.steps.some(step=>['after','on'].includes(parseRelativeStep(step).offset?.direction??''))?'event':'deadline';
}
