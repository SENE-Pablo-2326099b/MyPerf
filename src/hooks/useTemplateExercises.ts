import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type TemplateExercise from '@/db/models/TemplateExercise';

export function useTemplateExercises(templateId: string | null): TemplateExercise[] {
  const [items, setItems] = useState<TemplateExercise[]>([]);

  useEffect(() => {
    if (!templateId) { setItems([]); return; }
    const sub = database
      .get<TemplateExercise>('template_exercises')
      .query(Q.where('template_id', templateId), Q.sortBy('order', Q.asc))
      .observe()
      .subscribe(setItems);
    return () => sub.unsubscribe();
  }, [templateId]);

  return items;
}
