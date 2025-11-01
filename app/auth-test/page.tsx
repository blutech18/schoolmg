"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface SessionData {
  userId: number;
  role: string;
  email: string;
  name: string;
}

export default function AuthTestPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (sessionCookie) {
        const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        setSessionData(session);
      }
    } catch (error) {
      console.error("Error parsing session:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToDashboard = () => {
    if (!sessionData) return;

    switch (sessionData.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'dean':
        router.push('/dean');
        break;
      case 'programcoor':
        router.push('/coordinator');
        break;
      case 'instructor':
        router.push('/instructor');
        break;
      case 'student':
        router.push('/student');
        break;
      default:
        router.push('/not-allowed');
        break;
    }
  };

  const clearSession = () => {
    document.cookie = 'userSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setSessionData(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Authentication Test Page</h1>
          <p className="text-gray-600 mt-1">Debug authentication and session management</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
          <CardDescription>Current user session details</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="font-semibold">{sessionData.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{sessionData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{sessionData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <Badge variant="outline" className="font-semibold">
                    {sessionData.role}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={navigateToDashboard}>
                  Go to My Dashboard
                </Button>
                <Button variant="outline" onClick={clearSession}>
                  Clear Session
                </Button>
                <Button variant="outline" onClick={() => router.push('/')}>
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No active session found</p>
              <Button onClick={() => router.push('/')}>
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Access Test</CardTitle>
          <CardDescription>Test access to different role dashboards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin')}
              className="h-20 flex flex-col"
            >
              <span className="font-semibold">Admin Dashboard</span>
              <span className="text-xs text-gray-500">Requires: admin role</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/dean')}
              className="h-20 flex flex-col"
            >
              <span className="font-semibold">Dean Dashboard</span>
              <span className="text-xs text-gray-500">Requires: dean role</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/coordinator')}
              className="h-20 flex flex-col"
            >
              <span className="font-semibold">Coordinator Dashboard</span>
              <span className="text-xs text-gray-500">Requires: programcoor role</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/instructor')}
              className="h-20 flex flex-col"
            >
              <span className="font-semibold">Instructor Dashboard</span>
              <span className="text-xs text-gray-500">Requires: instructor role</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/student')}
              className="h-20 flex flex-col"
            >
              <span className="font-semibold">Student Dashboard</span>
              <span className="text-xs text-gray-500">Requires: student role</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/test')}
              className="h-20 flex flex-col"
            >
              <span className="font-semibold">Test Page</span>
              <span className="text-xs text-gray-500">Requires: any role</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Users</CardTitle>
          <CardDescription>Available test accounts from the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 border rounded">
                <p className="font-semibold">Admin User</p>
                <p>Email: admin@school.edu</p>
                <p>Password: 12345</p>
                <Badge variant="outline">admin</Badge>
              </div>
              <div className="p-3 border rounded">
                <p className="font-semibold">Instructor User</p>
                <p>Email: instructor@school.edu</p>
                <p>Password: 12345</p>
                <Badge variant="outline">instructor</Badge>
              </div>
              <div className="p-3 border rounded">
                <p className="font-semibold">Program Coordinator</p>
                <p>Email: progcoor@school.edu</p>
                <p>Password: 12345</p>
                <Badge variant="outline">programcoor</Badge>
              </div>
              <div className="p-3 border rounded">
                <p className="font-semibold">Student User</p>
                <p>Email: student@school.edu</p>
                <p>Password: 12345</p>
                <Badge variant="outline">student</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
