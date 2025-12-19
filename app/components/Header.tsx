'use client';

import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { LogOut, User } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { LogoutConfirmationModal } from '../../components/ui/logout-confirmation-modal'

interface UserInfo {
  name: string;
  role: string;
  email: string;
}

interface HeaderProps {
  isAdminPage?: boolean;
}

export default function Header({ isAdminPage = false }: HeaderProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check if we're on authentication pages
  const isAuthPage = pathname === '/' || pathname === '/sign-in';
  
  // Determine if we're on admin or coordinator pages (only after mounting to avoid hydration issues)
  const isAdminPageDetected = mounted ? pathname?.startsWith('/admin') : false;
  const isCoordinatorPageDetected = mounted ? pathname?.startsWith('/coordinator') : false;

  useEffect(() => {
    fetchUserInfo();
  }, [isAuthPage, isAdminPageDetected, isCoordinatorPageDetected]);

  const fetchUserInfo = async () => {
    // Don't fetch user info on authentication pages, admin pages, or coordinator pages (sidebar handles it)
    if (isAuthPage || isAdminPageDetected || isCoordinatorPageDetected) {
      return;
    }
    
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      
      const response = await fetch(`/api/users?id=${session.userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();

        let user: any = null;
        // Case 1: API returns { success: true, data: {...} }
        if (data && typeof data === 'object' && 'success' in data) {
          if (data.success && data.data) {
            user = data.data;
          }
        } else if (data && typeof data === 'object') {
          // Case 2: API returns user object directly
          user = data;
        }

        if (user) {
          setUserInfo({
            name: `${user.FirstName} ${user.LastName}`,
            role: user.Role,
            email: user.EmailAddress || user.Email || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear session cookie
      document.cookie = 'userSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'Administrator';
      case 'dean': return 'Dean';
      case 'programcoor': return 'Program Coordinator';
      case 'instructor': return 'Instructor';
      case 'student': return 'Student';
      default: return role;
    }
  };

  // Use a client-side only component for the header to avoid hydration issues
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Server-side render a simplified version
    return (
      <header className='bg-green-800 w-full text-white py-2 sticky top-0 z-50 h-[75px]'>
        <div className='container flex items-center justify-center px-4 h-full'>
          <div className='flex items-center gap-3'>
            <img 
              src="/img/cca-logo.png" 
              alt="cca-logo" 
              width={50} 
              height={100} 
              className='h-12 w-auto object-contain'
            />
            <h1 className='font-bold text-xl'>City College of Angeles</h1>
          </div>
        </div>
      </header>
    );
  }

  // Client-side render with full functionality
  return (
    <header className='bg-green-800 w-full text-white py-2 sticky top-0 z-50 h-[75px]'>
      <div className='w-full flex items-center justify-center px-4 h-full relative'>
        {/* Center title - always centered */}
        <div className='flex items-center gap-2 md:gap-3'>
          <img 
            src="/img/cca-logo.png" 
            alt="cca-logo" 
            width={50} 
            height={100} 
            className='h-10 md:h-12 w-auto object-contain'
          />
          <h1 className='font-bold text-base sm:text-lg md:text-xl lg:text-2xl whitespace-nowrap'>
            City College of Angeles
          </h1>
        </div>
         
        {/* Right side - actual user info and logout (hidden on auth, admin, and coordinator pages) */}
        <div className='absolute right-4 top-1/2 transform -translate-y-1/2'>
          {userInfo && !isAuthPage && !isAdminPageDetected && !isCoordinatorPageDetected && (
            <div className='flex items-center gap-2 md:gap-4'>
              <div className='hidden sm:flex items-center gap-2 text-sm'>
                <User className='h-4 w-4' />
                <div className='text-right'>
                  <div className='font-semibold text-xs md:text-sm'>{userInfo.name}</div>
                  <div className='text-green-200 text-xs'>{getRoleDisplayName(userInfo.role)}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className='text-white hover:bg-green-700 text-xs md:text-sm'
              >
                <LogOut className='h-3 w-3 md:h-4 md:w-4 mr-1' />
                <span className='hidden sm:inline'>Logout</span>
                <span className='sm:hidden'>Exit</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
        isLoading={isLoggingOut}
      />
    </header>
  )
}
