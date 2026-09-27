import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TaskStatus } from '../enums/task-status.enum.js';

const taskStatusNames = Object.keys(TaskStatus).filter((key) =>
  Number.isNaN(Number(key)),
);

@Schema({ _id: false })
export class TaskStatusHistory {
  @Prop({ type: String, enum: taskStatusNames, required: true })
  status: keyof typeof TaskStatus;

  @Prop({ type: Date, required: true })
  changedAt: Date;
}

export const TaskStatusHistorySchema =
  SchemaFactory.createForClass(TaskStatusHistory);

@Schema()
export class TaskHistory {
  @Prop({ type: String, required: true, unique: true, index: true })
  taskId: string;

  @Prop({ type: [TaskStatusHistorySchema], default: [] })
  history: TaskStatusHistory[];
}

export const TaskHistorySchema = SchemaFactory.createForClass(TaskHistory);
