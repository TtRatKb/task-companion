import {describe,expect,it} from 'vitest';
import {emptyData,type AppData,type Task} from './types';
import {reorderById,stepUpDown,transferSubtask,undoSubtaskTransfer} from './subtaskOrganization';

const old='2026-11-07T09:00:00Z';
const now=new Date('2026-11-07T10:00:00Z');
const step={
 id:'step-c',title:'ClassTime einrichten',completed:true,
 plannedDate:'2026-11-24',offset:{amount:3,unit:'days'} as const,estimatedMinutes:45
};
const task=(id:string,props:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:2,scheduledDate:null,deadlineDate:null,
 recurrence:null,completedAt:null,createdAt:old,updatedAt:old,...props
});
const seed=():AppData=>({...emptyData(),tasks:[
 task('source',{deadlineDate:'2026-11-27',subtasks:[
  {id:'step-a',title:'Aufgaben',completed:false,plannedDate:'2026-11-13'},
  {...step},
  {id:'step-d',title:'Drucken',completed:false,plannedDate:'2026-11-26'}
 ]}),
 task('target',{deadlineDate:'2026-12-04',projectId:'school',subtasks:[
  {id:'step-z',title:'Prüfen',completed:false,plannedDate:'2026-12-01'}
 ]}),
 task('undated',{subtasks:[]}),
 task('done',{completedAt:old,subtasks:[]})
],projects:[{id:'school',name:'Schule',color:'#123456',createdAt:old}]});

describe('Unteraufgaben organisieren ohne Datenverlust',()=>{
 it('reorders checklist rows by stable ID without editing their values',()=>{
  const original=[{id:'a',title:'A',date:'a'},{id:'b',title:'B',date:'b'},{id:'c',title:'C',date:'c'}];
  const one=reorderById(original,'c','a');
  expect(one.map(s=>s.id)).toEqual(['c','a','b']);
  expect(one[0]).toBe(original[2]);
  const other=stepUpDown(one,'c',1);
  expect(other.map(s=>s.id)).toEqual(['a','c','b']);
  expect(stepUpDown(other,'b',1)).toBe(other);
  expect(stepUpDown(other,'missing',-1)).toBe(other);
  expect(reorderById(other,'a','a')).toBe(other);
  expect(original.map(s=>s.id)).toEqual(['a','b','c']);
 });
 it('default move preserves the actual workday but unlinks the old deadline offset',()=>{
  const input=seed();
  const result=transferSubtask(input,'source','step-c','target','keep',old,old,now);
  expect(result.status).toBe('moved');
  const src=result.data.tasks[0],dest=result.data.tasks[1];
  expect(src.subtasks?.map(s=>s.id)).toEqual(['step-a','step-d']);
  expect(dest.subtasks?.map(s=>s.id)).toEqual(['step-z','step-c']);
  expect(dest.subtasks?.[1]).toEqual({
   ...step,offset:undefined
  });
  expect(dest.subtasks?.[1].plannedDate).toBe('2026-11-24');
  expect(dest.subtasks?.[1].completed).toBe(true);
  expect(src.deadlineDate).toBe('2026-11-27');
  expect(dest.deadlineDate).toBe('2026-12-04');
  expect(input.tasks[0].subtasks?.[1]).toEqual(step);
  expect(input.tasks[1].subtasks?.map(s=>s.id)).toEqual(['step-z']);
  expect(result.data.weeklyBudgetMinutes).toEqual(input.weeklyBudgetMinutes);
  expect(src.updatedAt).toBe(now.toISOString());
  expect(dest.updatedAt).toBe(now.toISOString());
  expect(result.data.tasks[2]).toBe(input.tasks[2]);
 });
 it('can rebase only by explicit choice and only with a target deadline',()=>{
  const input=seed();
  const rebased=transferSubtask(input,'source','step-c','target','rebase',old,old,now);
  expect(rebased.status).toBe('moved');
  expect(rebased.data.tasks[1].subtasks?.[1]).toEqual({...step,plannedDate:'2026-12-01'});
  const undated=transferSubtask(input,'source','step-c','undated','rebase',old,old,now);
  expect(undated.status).toBe('invalid');
  expect(undated.data).toBe(input);
  const ordinary=transferSubtask(input,'source','step-a','target','rebase',old,old,now);
  expect(ordinary.status).toBe('invalid');
 });
 it('can undo a move, restoring the old order and full relative date metadata',()=>{
  const input=seed();
  const moved=transferSubtask(input,'source','step-c','target','keep',old,old,now);
  const restored=undoSubtaskTransfer(moved.data,moved.receipt!,new Date('2026-11-07T11:00:00Z'));
  expect(restored.status).toBe('moved');
  expect(restored.data.tasks[0].subtasks).toEqual(input.tasks[0].subtasks);
  expect(restored.data.tasks[1].subtasks).toEqual(input.tasks[1].subtasks);
  expect(restored.data.tasks[0].deadlineDate).toBe(input.tasks[0].deadlineDate);
 });
 it('does not move or undo over concurrent changes from a second device',()=>{
  const input=seed();
  const stale=transferSubtask(input,'source','step-c','target','keep',old,'different',now);
  expect(stale.status).toBe('conflict');
  expect(stale.data).toBe(input);
  const moved=transferSubtask(input,'source','step-c','target','keep',old,old,now);
  const changed={...moved.data,tasks:moved.data.tasks.map(t=>t.id==='target'?{...t,updatedAt:'2026-11-07T10:30:00Z'}:t)};
  expect(undoSubtaskTransfer(changed,moved.receipt!).status).toBe('conflict');
  expect(changed.tasks[1].subtasks?.some(s=>s.id==='step-c')).toBe(true);
 });
 it('rejects same-task transfers, invalid IDs, closed source or target',()=>{
  const input=seed();
  expect(transferSubtask(input,'source','step-c','source','keep',old,old).status).toBe('invalid');
  expect(transferSubtask(input,'source','no-step','target','keep',old,old).status).toBe('invalid');
  expect(transferSubtask(input,'source','step-c','done','keep',old,old).status).toBe('missing');
  expect(transferSubtask(input,'gone','step-c','target','keep',old,old).status).toBe('missing');
  expect(transferSubtask(input,'source','step-c','target','wrong' as 'keep',old,old).status).toBe('invalid');
  const duplicated={...input,tasks:input.tasks.map(t=>t.id==='target'?{...t,subtasks:[{...step}]}:t)};
  expect(transferSubtask(duplicated,'source','step-c','target','keep',old,old).status).toBe('invalid');
 });
});
