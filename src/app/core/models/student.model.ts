export type RelationType = 'mother' | 'father' | 'guardian';

export interface ClassSchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Subject {
  id: string;
  name: string;
  schedules: ClassSchedule[];
}

export interface StudentUser {
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  relation: RelationType;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  grade: string;
  section: string;
  ParentRelation?: RelationType | null;
  users: StudentUser[];
  subjects: Subject[];
  createdAt: string;
}
