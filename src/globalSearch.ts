import {isOpenTask} from './deadlineRadar';
import type {AppData,Priority,Task,TaskTemplate} from './types';

export type SearchStatus='open'|'done'|'all';
export type SearchKind='all'|'tasks'|'templates';
export type SearchProject='all'|'inbox'|string;
export interface SearchFilters {
 query:string;
 status:SearchStatus;
 kind:SearchKind;
 project:SearchProject;
 priority:'all'|Priority;
}
export type SearchHit=
 | {kind:'task';id:string;task:Task;score:number;matchedSteps:string[];matchedDescription:boolean}
 | {kind:'template';id:string;template:TaskTemplate;score:number;matchedSteps:string[];matchedDescription:boolean};
export const DEFAULT_SEARCH_FILTERS:SearchFilters={
 query:'',status:'open',kind:'all',project:'all',priority:'all'
};

export function normalizeSearch(value:string):string {
 return value.toLocaleLowerCase('de-DE')
  .replace(/ß/g,'ss')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/\s+/g,' ').trim();
}

function terms(query:string):string[] {
 return normalizeSearch(query).split(' ').filter(Boolean);
}

function includesAll(haystack:string[], tokens:string[]):boolean {
 if(!tokens.length)return true;
 const content=normalizeSearch(haystack.join(' '));
 return tokens.every(token=>content.includes(token));
}

function score(title:string,description:string,steps:string[],projectName:string,tokens:string[]):number {
 if(!tokens.length)return 0;
 const text=normalizeSearch(title);
 const stepText=normalizeSearch(steps.join(' '));
 const desc=normalizeSearch(description);
 const project=normalizeSearch(projectName);
 const expression=tokens.join(' ');
 if(text===expression)return 110;
 if(text.includes(expression))return 85;
 if(tokens.every(token=>text.includes(token)))return 65;
 if(tokens.some(token=>text.includes(token)))return 40;
 if(tokens.every(token=>stepText.includes(token)))return 28;
 if(tokens.some(token=>stepText.includes(token)))return 20;
 if(tokens.some(token=>desc.includes(token)))return 12;
 if(tokens.some(token=>project.includes(token)))return 5;
 return 0;
}

function compares(a:SearchHit,b:SearchHit):number {
 if(a.score!==b.score)return b.score-a.score;
 if(a.kind!==b.kind)return a.kind==='task'?-1:1;
 if(a.kind==='task'&&b.kind==='task'){
  if(a.task.priority!==b.task.priority)return a.task.priority-b.task.priority;
  const due=(a.task.deadlineDate??'9999-12-31').localeCompare(b.task.deadlineDate??'9999-12-31');
  if(due)return due;
  return a.task.title.localeCompare(b.task.title,'de')||a.id.localeCompare(b.id);
 }
 if(a.kind==='template'&&b.kind==='template')
  return a.template.name.localeCompare(b.template.name,'de')||a.id.localeCompare(b.id);
 return 0;
}

/** Read-only search; it never edits AppData or cloud data. */
export function searchAll(data:AppData,options:SearchFilters):SearchHit[] {
 const tokens=terms(options.query);
 const projects=new Map(data.projects.map(p=>[p.id,p.name]));
 const hits:SearchHit[]=[];
 if(options.kind!=='templates'){
  for(const task of data.tasks){
   const open=isOpenTask(task);
   if(options.status==='open'&&!open)continue;
   if(options.status==='done'&&open)continue;
   if(options.project!=='all' &&
     (options.project==='inbox'?task.projectId!==null:task.projectId!==options.project))continue;
   if(options.priority!=='all'&&task.priority!==options.priority)continue;
   const steps=(task.subtasks??[]).map(s=>s.title);
   const projectName=projects.get(task.projectId??'')??'';
   if(!includesAll([task.title,task.description,...steps,projectName],tokens))continue;
   hits.push({
    kind:'task',id:task.id,task,
    score:score(task.title,task.description,steps,projectName,tokens),
    matchedSteps:tokens.length?steps.filter(s=>tokens.some(token=>normalizeSearch(s).includes(token))).slice(0,3):[],
    matchedDescription:tokens.length>0&&tokens.some(t=>normalizeSearch(task.description).includes(t))
   });
  }
 }
 // Template results are actionable only when status, project and priority do not filter them away.
 if(options.kind!=='tasks'&&options.status!=='done'&&options.project==='all'&&options.priority==='all'){
  for(const template of data.templates){
   if(!includesAll([template.name,template.description,...template.steps],tokens))continue;
   hits.push({
    kind:'template',id:template.id,template,
    score:score(template.name,template.description,template.steps,'',tokens),
    matchedSteps:tokens.length?template.steps.filter(s=>tokens.some(token=>normalizeSearch(s).includes(token))).slice(0,3):[],
    matchedDescription:tokens.length>0&&tokens.some(t=>normalizeSearch(template.description).includes(t))
   });
  }
 }
 return hits.sort(compares);
}
