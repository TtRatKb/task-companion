import {describe,expect,it} from 'vitest';
import {executeCalendarItem,undoCalendarExecution} from './calendarExecution';
import {monthCalendarItems,dayCalendarItems,monthCalendarSummary} from './monthCalendar';
import {emptyData,type AppData,type Task} from './types';
const stamp='2026-11-01T09:00:00Z';
const now=new Date('2026-11-07T12:00:00+01:00');
const later=new Date('2026-11-07T13:00:00+01:00');
const task=(id:string,fields:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:2,scheduledDate:null,
 deadlineDate:null,recurrence:null,completedAt:null,createdAt:stamp,updatedAt:stamp,
 subtasks:[],...fields
});
const fixture=():AppData=>({...emptyData(),tasks:[
 task('exam',{title:'Klassenarbeit',projectId:'math',deadlineDate:'2026-11-27',
  subtasks:[
   {id:'open',title:'ClassTime eintragen',completed:false,plannedDate:'2026-11-07',estimatedMinutes:60,
    offset:{amount:20,unit:'days'}},
   {id:'done',title:'Erwartungshorizont',completed:true,plannedDate:'2026-11-07',estimatedMinutes:30},
   {id:'undated',title:'Kopieren',completed:true}
  ]}),
 task('parent',{title:'Elternbrief',projectId:null,scheduledDate:'2026-11-07',estimatedMinutes:45}),
 task('closed',{title:'Abgeschlossene KA',projectId:'math',scheduledDate:'2026-11-04',
  completedAt:'2026-11-06T13:00:00+01:00',deadlineDate:'2026-11-17'}),
 task('future',{title:'Routine',scheduledDate:'2026-11-12',
  recurrence:{kind:'interval',unit:'weeks',every:1,anchorDate:'2026-11-12'},subtasks:[
   {id:'r1',title:'Wiederholungsschritt',completed:true,plannedDate:'2026-11-08'}]})
]});
describe('Kalenderabschlüsse ohne ungewollte Terminänderungen',()=>{
 it('checks only one subtask and can undo without altering its offset, deadlines or sibling',()=>{
  const input=fixture(),before=JSON.stringify(input);
  const done=executeCalendarItem(input,'exam','open',stamp,'complete',now);
  expect(done.status).toBe('changed');
  expect(done.data.tasks[0].subtasks?.[0]).toMatchObject({
   id:'open',completed:true,plannedDate:'2026-11-07',offset:{amount:20,unit:'days'},estimatedMinutes:60
  });
  expect(done.data.tasks[0].subtasks?.[1]).toEqual(input.tasks[0].subtasks?.[1]);
  expect(done.data.tasks[0].deadlineDate).toBe('2026-11-27');
  expect(done.data.tasks[0].completedAt).toBeNull();
  expect(JSON.stringify(input)).toBe(before);
  const undone=undoCalendarExecution(done.data,done.receipt!,later);
  expect(undone.status).toBe('changed');
  expect(undone.data.tasks[0].subtasks).toEqual(input.tasks[0].subtasks);
 });
 it('reopens a completed subtask and lets the user undo reopening',()=>{
  const input=fixture();
  const reopened=executeCalendarItem(input,'exam','done',stamp,'reopen',now);
  expect(reopened.status).toBe('changed');
  expect(reopened.data.tasks[0].subtasks?.[1].completed).toBe(false);
  const restored=undoCalendarExecution(reopened.data,reopened.receipt!,later);
  expect(restored.status).toBe('changed');
  expect(restored.data.tasks[0].subtasks?.[1].completed).toBe(true);
 });
 it('completes an entire nonrecurring parent and undoes via its existing completion event',()=>{
  const input=fixture();
  const completed=executeCalendarItem(input,'parent',undefined,stamp,'complete',now);
  expect(completed.status).toBe('changed');
  expect(completed.data.tasks[1].completedAt).toBe(now.toISOString());
  expect(completed.data.completionEvents).toHaveLength(1);
  const restored=undoCalendarExecution(completed.data,completed.receipt!,later);
  expect(restored.status).toBe('changed');
  expect(restored.data.tasks[1].completedAt).toBeNull();
  expect(restored.data.completionEvents[0].undoneAt).toBe(later.toISOString());
 });
 it('rejects stale revisions, wrong step states and closed tasks without editing anything',()=>{
  const input=fixture();
  for(const result of [
   executeCalendarItem(input,'exam','open','older-version','complete',now),
   executeCalendarItem(input,'exam','done',stamp,'complete',now),
   executeCalendarItem(input,'exam','open',stamp,'reopen',now),
   executeCalendarItem(input,'closed',undefined,stamp,'complete',now),
   executeCalendarItem(input,'missing','step',stamp,'complete',now)
  ])expect(result.data).toBe(input);
  expect(executeCalendarItem(input,'exam','open','older-version','complete',now).status).toBe('conflict');
  const successful=executeCalendarItem(input,'exam','open',stamp,'complete',now);
  const changed={...successful.data,tasks:successful.data.tasks.map(t=>
   t.id==='exam'?{...t,updatedAt:'2026-11-07T12:30:00Z'}:t)};
  expect(undoCalendarExecution(changed,successful.receipt!,later).status).toBe('conflict');
  expect(changed.tasks[0].subtasks?.[0].completed).toBe(true);
 });
 it('blocks premature recurring completion and preserves dates when later completed',()=>{
  const input=fixture();
  const premature=executeCalendarItem(input,'future',undefined,stamp,'complete',now);
  expect(premature.status).toBe('blocked');
  expect(premature.data).toBe(input);
  const eligible={...input,tasks:input.tasks.map(t=>t.id==='future'?{...t,scheduledDate:'2026-11-07'}:t)};
  const completed=executeCalendarItem(eligible,'future',undefined,stamp,'complete',now);
  expect(completed.status).toBe('changed');
  expect(completed.data.tasks[3]).toMatchObject({
   scheduledDate:'2026-11-12',recurrence:input.tasks[3].recurrence,
   subtasks:[{id:'r1',completed:false,plannedDate:'2026-11-08'}]
  });
  const undone=undoCalendarExecution(completed.data,completed.receipt!,later);
  expect(undone.status).toBe('changed');
  expect(undone.data.tasks[3].scheduledDate).toBe('2026-11-07');
  expect(undone.data.tasks[3].subtasks?.[0].completed).toBe(true);
 });
});
describe('Erledigte optional im Monatskalender, ohne doppelte Arbeitszeit',()=>{
 it('hides completed rows by default and shows them only when requested',()=>{
  const items=monthCalendarItems(fixture().tasks,'2026-11');
  expect(dayCalendarItems(items,'2026-11-07').map(i=>i.kind)).toEqual(['work','work']);
  expect(items.some(item=>item.kind==='done')).toBe(false);
  const withDone=monthCalendarItems(fixture().tasks,'2026-11',true);
  const today=dayCalendarItems(withDone,'2026-11-07');
  expect(today.filter(i=>i.kind==='work')).toHaveLength(2);
  expect(today.filter(i=>i.kind==='done')).toMatchObject([
   {kind:'done',subtaskId:'done',title:'Erwartungshorizont',date:'2026-11-07',taskId:'exam'}
  ]);
  expect(withDone.some(i=>i.kind==='done'&&i.title==='Kopieren')).toBe(false);
 });
 it('shows a completed one-off on its real completion date, with no misleading deadline',()=>{
  const items=monthCalendarItems(fixture().tasks,'2026-11',true);
  expect(dayCalendarItems(items,'2026-11-06')).toContainEqual(expect.objectContaining({
   kind:'done',title:'Abgeschlossene KA',taskId:'closed'
  }));
  expect(items.filter(i=>i.taskId==='closed')).toHaveLength(1);
  expect(items.some(i=>i.kind==='ready'&&i.taskId==='closed')).toBe(false);
 });
 it('does not add completed entries to workload minutes or open task counts',()=>{
  const open=monthCalendarSummary(monthCalendarItems(fixture().tasks,'2026-11'),'2026-11');
  const withDone=monthCalendarSummary(monthCalendarItems(fixture().tasks,'2026-11',true),'2026-11');
  expect(withDone).toEqual(open);
  expect(withDone.knownMinutes).toBe(105);
 });
});
