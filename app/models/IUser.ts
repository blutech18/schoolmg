export interface IUser {
  UserID: number,
  LastName: string,
  FirstName: string,
  MiddleName: string,
  EmailAddress: string,
  Password: string,
  Sex: string,
  // Note: 'admin' role is deprecated - programcoor now has admin privileges
  // 'admin' kept for backward compatibility with existing database records
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


// Note: admin role is deprecated - programcoor (Program Coordinator) now has admin privileges
// New admin accounts cannot be created via the system - only programcoor, dean, instructor, and student
export enum ERoles {
  admin = "admin",           // Deprecated - kept for backward compatibility only
  instructor = "instructor",
  programcoor = "programcoor", // Program Coordinator - has admin interface access
  dean = "dean",
  student = "student"
}