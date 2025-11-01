export interface IUser {
  UserID: number,
  LastName: string,
  FirstName: string,
  MiddleName: string,
  EmailAddress: string,
  Password: string,
  Sex: string,
  Role: "admin" | "instructor" | "programcoor" | "dean" | "student",
  Status: string,
  IsPWD: boolean,
  ContactNumber?: string,
  CreatedAt?: string,
  UpdatedAt?: string,
}

export interface IStudent extends IUser{
  StudentID: string;
  Course: string;
  YearLevel: number;
  Section: string;
  DateOfEnrollment: string;
  StudentNumber?: string;
  ContactNumber?: string;
  GuardianName?: string;
  GuardianContact?: string;
  Address?: string;
}

export interface IStudentOnly{
  StudentID: string;
  Course: string;
  YearLevel: number;
  Section: string;
  DateOfEnrollment: string;
  StudentNumber?: string;
  ContactNumber?: string;
  GuardianName?: string;
  GuardianContact?: string;
  Address?: string;
}


export enum ERoles {
  admin = "admin",
  instructor = "instructor",
  programcoor = "programcoor",
  dean = "dean",
  student = "student"
}