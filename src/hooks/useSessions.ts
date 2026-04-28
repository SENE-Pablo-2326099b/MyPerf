import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type Session from '@/db/models/Session';

export function useSessions(): Session[] {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const sub = database
      .get<Session>('sessions')
      .query(
        Q.where('ended_at', Q.notEq(null)),
        Q.sortBy('started_at', Q.desc),
      )
      .observe()
      .subscribe(setSessions);
    return () => sub.unsubscribe();
  }, []);

  return sessions;
}
