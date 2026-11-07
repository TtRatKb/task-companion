import {describe,expect,it} from 'vitest';
import {firstOccurrence,intervalRecurrence,nextOccurrence,recurrenceLabel,recurrence} from './recurrence';
import {completeTask,undoCompletion} from './domain';
import {emptyData,type Task} from './types';

const makeTask=(scheduledDate:string,rule:Task['recurrence']):Task=>({
 id:'routine',title:'Routine',description:'',projectId:null,priority:3,
 scheduledDate,deadlineDate:'2026-12-24',recurrence:rule,
 completedAt:null,createdAt:'2026-10-01T10:00:00Z',updatedAt:'2026-10-01T10:00:00Z',
 estimatedMinutes:60,subtasks:[{id:'one',title:'Kontrolle',completed:true,estimatedMinutes:30}]
});

describe('Flexible kalenderfeste Wiederholungen (v1.5)',()=>{
 it('calculates every 3 days without moving cadence when completed late',()=>{
  const r=intervalRecurrence(3,'days','2026-11-01');
  expect(nextOccurrence('2026-11-01',r)).toBe('2026-11-04');
  expect(nextOccurrence('2026-11-04',r)).toBe('2026-11-07');
  expect(nextOccurrence('2026-11-08',r)).toBe('2026-11-10');
  expect(firstOccurrence('2026-11-05',r)).toBe('2026-11-07');
 });
 it('maintains biweekly anchor through DST and missed weeks',()=>{
  const r=intervalRecurrence(2,'weeks','2026-03-16');
  expect(nextOccurrence('2026-03-16',r)).toBe('2026-03-30');
  expect(nextOccurrence('2026-03-29',r)).toBe('2026-03-30');
  expect(nextOccurrence('2026-04-03',r)).toBe('2026-04-13');
  expect(nextOccurrence('2026-04-20',r)).toBe('2026-04-27');
 });
 it('clamps Feb from Jan 31 and restores the 31st in March',()=>{
  const r=intervalRecurrence(1,'months','2026-01-31');
  expect(nextOccurrence('2026-01-31',r)).toBe('2026-02-28');
  expect(nextOccurrence('2026-02-28',r)).toBe('2026-03-31');
  expect(nextOccurrence('2026-03-31',r)).toBe('2026-04-30');
  expect(nextOccurrence('2026-04-30',r)).toBe('2026-05-31');
  expect(nextOccurrence('2026-05-31',r)).toBe('2026-06-30');
 });
 it('handles leap years and every second month with calendar alignment',()=>{
  const leap=intervalRecurrence(1,'months','2024-01-31');
  expect(nextOccurrence('2024-01-31',leap)).toBe('2024-02-29');
  expect(nextOccurrence('2024-02-29',leap)).toBe('2024-03-31');
  const two=intervalRecurrence(2,'months','2026-01-31');
  expect(nextOccurrence('2026-01-31',two)).toBe('2026-03-31');
  expect(nextOccurrence('2026-04-01',two)).toBe('2026-05-31');
  expect(firstOccurrence('2026-02-01',two)).toBe('2026-03-31');
 });
 it('never sets a first occurrence before a chosen future starting date',()=>{
  const r=intervalRecurrence(2,'weeks','2026-12-10');
  expect(firstOccurrence('2026-11-07',r)).toBe('2026-12-10');
  expect(nextOccurrence('2026-11-07',r)).toBe('2026-12-10');
 });
 it('preserves old weekdays and gives human readable interval descriptions',()=>{
  const old=recurrence([1,3,5])!;
  expect(nextOccurrence('2026-11-06',old)).toBe('2026-11-09');
  expect(recurrenceLabel(intervalRecurrence(1,'months','2026-11-15'))).toBe('Jeden Monat');
  expect(recurrenceLabel(intervalRecurrence(2,'weeks','2026-11-07'))).toBe('Alle 2 Wochen');
  expect(recurrenceLabel(intervalRecurrence(3,'days','2026-11-07'))).toBe('Alle 3 Tage');
 });
 it('rejects invalid intervals, negative cadence, invalid month/day and unknown units',()=>{
  expect(()=>intervalRecurrence(0,'days','2026-11-07')).toThrow();
  expect(()=>intervalRecurrence(1.5,'weeks','2026-11-07')).toThrow();
  expect(()=>intervalRecurrence(1000,'months','2026-11-07')).toThrow();
  expect(()=>intervalRecurrence(1,'months','2026-02-31')).toThrow();
  expect(()=>intervalRecurrence(1,'years' as 'days','2026-11-07')).toThrow();
 });
 it('marks just the current occurrence done, resets its checklist and never shifts the deadline',()=>{
  const rule=intervalRecurrence(2,'weeks','2026-11-02');
  const data={...emptyData(),tasks:[makeTask('2026-11-02',rule)]};
  const now=new Date('2026-11-07T11:00:00+01:00');
  const after=completeTask(data,'routine',now);
  expect(after.tasks[0]).toMatchObject({
   scheduledDate:'2026-11-16',deadlineDate:'2026-12-24',
   recurrence:rule,estimatedMinutes:60,subtasks:[{id:'one',completed:false}]
  });
  expect(data.tasks[0].subtasks![0].completed).toBe(true);
  const twice=completeTask(after,'routine',now);
  expect(twice).toBe(after);
  const undo=undoCompletion(after,after.completionEvents[0].id,new Date('2026-11-07T12:00:00Z'));
  expect(undo.tasks[0].scheduledDate).toBe('2026-11-02');
  expect(undo.tasks[0].subtasks![0].completed).toBe(true);
  expect(undo.tasks[0].deadlineDate).toBe('2026-12-24');
 });
 it('cannot complete a future occurrence before its planned day',()=>{
  const r=intervalRecurrence(1,'months','2026-12-15');
  const data={...emptyData(),tasks:[makeTask('2026-12-15',r)]};
  expect(completeTask(data,'routine',new Date('2026-11-07T09:00:00+01:00'))).toBe(data);
 });
});
