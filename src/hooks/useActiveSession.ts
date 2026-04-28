import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type Session from '@/db/models/Session';

export function useActiveSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const sub = database
      .get<Session>('sessions')
      .query(Q.where('ended_at', Q.eq(null)))
      .observe()
      .subscribe(sessions => setSession(sessions[0] ?? null));
    return () => sub.unsubscribe();
  }, []);

  return session;
}
