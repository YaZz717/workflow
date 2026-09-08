import type { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/validations/task";

export type TaskStatusValue = (typeof TASK_STATUSES)[number];
export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number];

export type BoardTask = {
  id: string;
  number: number;
  title: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  boardOrder: number;
  dueDate: string | null;
  estimateMinutes: number | null;
  project: { id: string; key: string; name: string; color: string };
  assignees: { id: string; name: string | null; image: string | null }[];
  tags: { id: string; name: string; color: string }[];
  commentCount: number;
  attachmentCount: number;
  subtaskTotal: number;
  subtaskDone: number;
};

export type ProjectMemberLite = {
  id: string;
  name: string | null;
  image: string | null;
  email: string;
};

export type TagLite = { id: string; name: string; color: string };
