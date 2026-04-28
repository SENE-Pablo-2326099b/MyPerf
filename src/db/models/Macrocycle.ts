import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';

export default class Macrocycle extends Model {
  static table = 'macrocycles' as const;

  @field('name') name!: string;
  @field('goal_description') goalDescription!: string | null;
  @date('start_date') startDate!: Date;
  @date('end_date') endDate!: Date | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
