export interface ISchedule {
  ScheduleID: number;
  Course: string | null;
  Lecture: number | null;
  Laboratory: number | null;
  Units: number | null;
  InstructorID: number | null;
  Section: string | null;
  YearLevel: number | null;
  Day: string | null;
  Time: string | null;
  Room: string | null;
  TotalSeats: number | null;
  SeatCols: number | null;
  SeatMap: string | null;
  // New fields for separate Lecture and Laboratory seat maps
  LectureSeatMap?: string | null;
  LaboratorySeatMap?: string | null;
  LectureSeatCols?: number | null;
  LaboratorySeatCols?: number | null;
  // Additional fields from API responses
  SubjectCode?: string;
  SubjectName?: string;
  InstructorName?: string;
  SubjectID?: number;
  ClassType?: string;
  Semester?: string;
  AcademicYear?: string;
}