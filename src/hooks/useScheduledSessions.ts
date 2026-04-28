import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type ScheduledSession from '@/db/models/ScheduledSession';

export function useScheduledSessionsInRange(start: Date, end: Date): ScheduledSession[] {
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);

  useEffect(() => {
    const sub = database
      .get<ScheduledSession>('scheduled_sessions')
      .query(
        Q.where('planned_date', Q.gte(start.getTime())),
        Q.where('planned_date', Q.lte(end.getTime())),
        Q.sortBy('planned_date', Q.asc),
      )
      .observe()
      .subscribe(setSessions);
    return () => sub.unsubscribe();
  }, [start.getTime(), end.getTime()]);

  return sessions;
}

export function useScheduledSessionsForDate(date: Date): ScheduledSession[] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return useScheduledSessionsInRange(start, end);
}
