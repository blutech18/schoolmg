import { type NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  const hasUserCookie = request.cookies.has("userSession");
  const sessionCookie = request.cookies.get("userSession")?.value;

  // Define route patterns and their allowed roles
  const routePermissions = {
    "/admin": ["programcoor"], // Admin management pages accessible to Program Coordinator only
    "/dean": ["dean"],
    "/coordinator": ["programcoor"], // Program Coordinator dashboard
    "/instructor": ["instructor"],
    "/student": ["student"],
    "/test": ["dean", "instructor", "programcoor", "student"]
  };

  // Special permissions for specific routes (if needed in the future)
  const specialRoutePermissions: Record<string, string[]> = {
    // "/admin/grades": ["admin", "dean"],
    // "/admin/attendance": ["admin", "dean"]
  };

  // All protected routes that require authentication
  const protectedRoutes = Object.keys(routePermissions);

  const isProtectedRoute = protectedRoutes.some((route) =>
    currentPath.startsWith(route)
  );

  let role: string | null = null;
  let userId: number | null = null;

  if (sessionCookie) {
    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie));
      role = session?.role ?? null;
      userId = session?.userId ?? null;
      
      // Debug logging (remove in production)
      console.log(`Middleware - Path: ${currentPath}, Role: ${role}, UserID: ${userId}`);
    } catch (err) {
      console.warn("Failed to parse session cookie:", err);
      // Clear invalid cookie
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("userSession");
      return response;
    }
  }

  // Redirect if accessing a protected route and not logged in
  if (isProtectedRoute && !hasUserCookie) {
    console.log(`Middleware - Redirecting to login: ${currentPath} (no session)`);
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check role-based access for protected routes
  if (isProtectedRoute && hasUserCookie) {
    // First check for special route permissions
    const specialRoute = Object.keys(specialRoutePermissions).find((route) =>
      currentPath.startsWith(route)
    );

    if (specialRoute) {
      const allowedRoles = specialRoutePermissions[specialRoute as keyof typeof specialRoutePermissions];
      
      if (!role || !allowedRoles.includes(role)) {
        console.log(`Middleware - Access denied (special route): ${currentPath}, Role: ${role}, Allowed: ${allowedRoles.join(', ')}`);
        return NextResponse.redirect(new URL("/not-allowed", request.url));
      }
      
      console.log(`Middleware - Access granted (special route): ${currentPath}, Role: ${role}`);
    } else {
      // Check regular route permissions
      const matchedRoute = protectedRoutes.find((route) =>
        currentPath.startsWith(route)
      );

      if (matchedRoute) {
        const allowedRoles = routePermissions[matchedRoute as keyof typeof routePermissions];
        
        if (!role || !allowedRoles.includes(role)) {
          console.log(`Middleware - Access denied: ${currentPath}, Role: ${role}, Allowed: ${allowedRoles.join(', ')}`);
          return NextResponse.redirect(new URL("/not-allowed", request.url));
        }
        
        console.log(`Middleware - Access granted: ${currentPath}, Role: ${role}`);
      }
    }
  }

  // Role-based dashboard redirects
  if (currentPath === "/dashboard" && hasUserCookie && role) {
    switch (role) {
      case "admin":
        // Admin role deprecated - redirect to not-allowed
        return NextResponse.redirect(new URL("/not-allowed", request.url));
      case "dean":
        return NextResponse.redirect(new URL("/dean", request.url));
      case "programcoor":
        return NextResponse.redirect(new URL("/coordinator", request.url)); // Program Coordinator dashboard
      case "instructor":
        return NextResponse.redirect(new URL("/instructor", request.url));
      case "student":
        return NextResponse.redirect(new URL("/student", request.url));
      default:
        return NextResponse.redirect(new URL("/not-allowed", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
