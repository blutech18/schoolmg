'use client';

import { IUser } from '@/app/models/IUser';
import { createSession, ISessionData } from '@/helpers/session';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  

  async function handleLogin() {
    setIsLoading(true);
    setErrorMessage('');

    const trimmedEmail = email.trim();

    // Basic email length validation
    if (!trimmedEmail || trimmedEmail.length < 8 || trimmedEmail.length > 32) {
      alert('Email must be between 8 and 32 characters long');
      setIsLoading(false);
      return;
    }

    // Validate email domain
    if (!trimmedEmail.toLowerCase().endsWith('@cca.edu.ph')) {
      alert('Please use an email address ending with @cca.edu.ph');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (!password || password.length < 5 || password.length > 32) {
      alert('Password must be between 5 and 32 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setErrorMessage("Invalid email or password.")
        setIsLoading(false)
        return
      }

      const matchedUser = data.user
      const sessionData: ISessionData = {
        userId: matchedUser.UserID,
        email: matchedUser.EmailAddress,
        name: matchedUser.FirstName + " " + matchedUser.LastName,
        role: matchedUser.Role
      }

      await createSession(sessionData);

      // Redirect based on user role
      switch (matchedUser.Role) {
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
    } catch (e) {
      setErrorMessage("Login failed. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl p-8 w-md shadow-lg mx-auto flex flex-col" style={{ background: '#d4f0d4', border: '1.5px solid #a8d8a8', boxShadow: '0 4px 32px 0 rgba(150, 200, 150, 0.25)' }}>
      <Image src="/img/cca-logo.png" alt="" width={100} height={100} className="mx-auto" />

      <p className="text-center font-bold text-2xl text-green-800 mt-5">City College of Angeles</p>
      <p className="text-center text-lg font-bold">Portal Login</p>

      <p className="text-lg mt-5 mb-1 font-bold">Email</p>
      <input
        type="email"
        className="border px-4 py-2 rounded-lg transition-all bg-white"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={(e) => {
          const emailValue = e.target.value.trim();
          if (!emailValue) return;

          if (emailValue.length < 8 || emailValue.length > 32) {
            alert('Email must be between 8 and 32 characters long');
            return;
          }

          if (!emailValue.toLowerCase().endsWith('@cca.edu.ph')) {
            alert('Please use an email address ending with @cca.edu.ph');
          }
        }}
        minLength={8}
        maxLength={32}
        placeholder="example@cca.edu.ph"
      />

      <p className="text-lg mt-5 mb-1 font-bold">Password</p>
      <input
        type={showPassword ? 'text' : 'password'}
        className="border px-4 py-2 rounded-lg transition-all bg-white"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={(e) => {
          const passwordValue = e.target.value;
          if (!passwordValue) return;

          if (passwordValue.length < 5 || passwordValue.length > 32) {
            alert('Password must be between 5 and 32 characters long');
          }
        }}
        minLength={5}
        maxLength={32}
        placeholder="Password"
      />
      {password && (password.length < 5 || password.length > 32) && (
        <p className="text-xs text-red-600 mt-1">
          Password must be between 5 and 32 characters (currently {password.length})
        </p>
      )}

      <div className="flex mt-5 items-center gap-1">
        <input
          onClick={() => setShowPassword(!showPassword)}
          type="checkbox"
          className="border px-4 py-2 rounded-lg transition-all bg-white"
        />
        <p className="text-sm font-semibold">Show Password?</p>
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`text-white py-2 rounded-lg font-bold mt-5 transition-all ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-800 hover:bg-green-700'
        }`}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

    </div>
  );
}
