import { redirect } from 'next/navigation';

  export interface UserResponse {
    UserId: string;
    Fname: string;
    Lname: string;
    Role: string;
  }

  export const getUserResponse = (): UserResponse => {
    const userData = localStorage.getItem('userData');
    if (!userData) {
        // redirect('/sign-in');
        return { UserId: '', Fname: '', Lname: '', Role: '' };
    }
  
    try {
      const [ UserId, Fname, Lname, Role] = userData.split('-');
      if (UserId && Fname && Lname && Role) {
        return { UserId, Fname, Lname, Role,};
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  
    return {UserId: '', Fname: '', Lname: '', Role: ''}; 
  };
  
  export const setUserResponse = (userResponse: UserResponse) => {
  const result: UserResponse = userResponse;
    localStorage.setItem(
      'userData', `${result.UserId}-${result.Fname}-${result.Lname}-${result.Role}`
    );
  }


  export function toStandardTime(militaryTime: string): string {
    // Validate the input
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(militaryTime)) {
      throw new Error('Invalid time format. Expected HH:mm or HH:mm:ss.');
    }
  
    const parts = militaryTime.split(':');
    let hours = parseInt(parts[0], 10); // Convert hours to a number
    const minutes = parts[1];
    const seconds = parts[2] || '00'; // Default to '00' if seconds are not provided
  
    const isPM = hours >= 12; // Determine if it's PM
    if (hours === 0) {
      hours = 12; // Midnight is 12 AM
    } else if (hours > 12) {
      hours -= 12; // Convert to 12-hour format
    }
  
    const formattedTime = `${hours}:${minutes}:${seconds} ${isPM ? 'PM' : 'AM'}`;
  
    return formattedTime;
  }
  
 
  export function generateRandomID() {
    const max = 1000;
    const min = 30;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  export function getDateTime(): string {
    const date = new Date();
  
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
  
    return date.toLocaleDateString('en-US', options).replace(',', '');
  }
  
export async function isMobileView() : Promise<boolean> {
  if(window.innerWidth < 1024){
    return true;
  }
  return false;
}

export async function fetchData(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }

export  function getRoleColor(role: string): string {
  switch (role) {
    case "admin":
      return "bg-blue-600"
    case "instructor":
      return "bg-green-600"
    case "programcoor":
      return "bg-orange-500"
    case "dean":
      return "bg-purple-600"
    case "student":
      return "bg-gray-600"
    default:
      return "bg-black"
  }
}

export function capitalizeString(str: string) {
   return str.charAt(0).toUpperCase() + str.slice(1);
}