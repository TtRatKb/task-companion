import {describe,expect,it} from 'vitest';import {addDays,nextWeekday,todayLocal} from './date';
describe('Kalenderdaten',()=>{it('bleibt stabil',()=>expect(addDays('2026-03-31',1)).toBe('2026-04-01'));it('findet nächsten Montag',()=>expect(nextWeekday('2026-11-09',1)).toBe('2026-11-16'));it('nutzt Berlin',()=>expect(todayLocal(new Date('2026-03-29T22:30:00Z'))).toBe('2026-03-30'))});
