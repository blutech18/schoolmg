'use client'
import React, { useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ERoles, IStudent, IUser } from '@/app/models/IUser'
import { capitalizeString } from '@/helpers/helper'
import { brandedToast } from '@/components/ui/branded-toast'
import { Eye, EyeOff } from 'lucide-react'

export default function AddInstructorDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [formValid, setFormValid] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<IUser>({
    UserID: 0,
    FirstName: '',
    LastName: '',
    MiddleName: '',
    EmailAddress: '',
    Password: '',
    Role: 'instructor',
    Sex: '',
    Status: 'active',
    IsPWD: false,
    ContactNumber: '',
  })

  // Validation functions
  const validateEmail = (email: string): string => {
    if (!email.trim()) return 'Email is required'
    const emailLower = email.trim().toLowerCase()
    if (!/@cca\.edu\.ph$/i.test(emailLower)) {
      return 'Email must end with @cca.edu.ph'
    }
    return ''
  }

  const validateContactNumber = (contact: string): string => {
    if (!contact || !contact.trim()) return 'Contact number is required'
    if (!/^\d+$/.test(contact)) return 'Contact number must contain only digits'
    if (!/^09\d{9}$/.test(contact)) {
      return 'Contact number must be exactly 11 digits starting with 09'
    }
    return ''
  }

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {}
    
    // Required field validations
    if (!form.FirstName.trim()) errors.FirstName = 'First name is required'
    if (!form.LastName.trim()) errors.LastName = 'Last name is required'
    if (!form.EmailAddress.trim()) errors.EmailAddress = 'Email is required'
    if (!form.Password.trim()) errors.Password = 'Password is required'
    if (!form.Sex) errors.Sex = 'Sex is required'
    
    // Contact number validation
    if (!form.ContactNumber || !form.ContactNumber.trim()) {
      errors.ContactNumber = 'Contact number is required'
    } else {
      const contactError = validateContactNumber(form.ContactNumber)
      if (contactError) errors.ContactNumber = contactError
    }
    
    // Email validation
    const emailError = validateEmail(form.EmailAddress)
    if (emailError) errors.EmailAddress = emailError
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Limit contact number to 11 digits
    let processedValue = value;
    if (name === 'ContactNumber') {
      // Only allow digits
      processedValue = value.replace(/\D/g, '');
      // Limit to 11 digits
      if (processedValue.length > 11) {
        processedValue = processedValue.slice(0, 11);
      }
    }
    
    const updatedForm = {
      ...form,
      [name]: name === 'IsPWD' ? (value === 'true') : processedValue
    };
    
    setForm(updatedForm);

    // Validate email or contact number in real-time
    if (name === 'EmailAddress') {
      const emailError = validateEmail(updatedForm.EmailAddress);
      setValidationErrors(prev => ({
        ...prev,
        EmailAddress: emailError || ''
      }));
    } else if (name === 'ContactNumber') {
      const contactError = validateContactNumber(updatedForm.ContactNumber || '');
      setValidationErrors(prev => ({
        ...prev,
        ContactNumber: contactError || ''
      }));
    } else {
      // Clear validation error for other fields when user starts typing
      if (validationErrors[name]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    }
    
    // Check if form is valid and update the state
    setTimeout(() => {
      const valid = isFormValidCheck(updatedForm);
      setFormValid(valid);
    }, 0);
  }

  const resetForm = () => {
    setForm({
      UserID: 0,
      FirstName: '',
      LastName: '',
      MiddleName: '',
      EmailAddress: '',
      Password: '',
      Role: 'instructor',
      Sex: '',
      Status: 'active',
      IsPWD: false,
      ContactNumber: '',
    })
    setValidationErrors({})
    setFormValid(false)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isSubmitting) return
    
    // Validate form before submission
    if (!validateForm()) {
      return
    }
    
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create instructor');
      }

      const result = await res.json()
      brandedToast.success(
        `Instructor added successfully! Instructor ID: ${result.PrefixedID}`,
        { title: 'Success' }
      )
      resetForm()
      setOpen(false)
      onAdded()
    } catch (error) {
      console.error('Create failed:', error)
      brandedToast.error(
        error instanceof Error ? error.message : 'Unknown error',
        { title: 'Failed to create instructor' }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if form is valid for submit button state
  const isFormValidCheck = (formData: typeof form) => {
    // Check required fields
    if (!formData.FirstName.trim()) {
      console.log('Validation: FirstName is empty')
      return false
    }
    if (!formData.LastName.trim()) {
      console.log('Validation: LastName is empty')
      return false
    }
    if (!formData.EmailAddress.trim()) {
      console.log('Validation: EmailAddress is empty')
      return false
    }
    if (!formData.Password.trim()) {
      console.log('Validation: Password is empty')
      return false
    }
    if (!formData.Sex) {
      console.log('Validation: Sex is empty')
      return false
    }
    if (!formData.ContactNumber || !formData.ContactNumber.trim()) {
      console.log('Validation: ContactNumber is empty')
      return false
    }
    
    // Check for validation errors
    const emailError = validateEmail(formData.EmailAddress)
    if (emailError) {
      console.log('Validation: Email error:', emailError)
      return false
    }
    const contactError = validateContactNumber(formData.ContactNumber)
    if (contactError) {
      console.log('Validation: Contact error:', contactError)
      return false
    }
    
    console.log('Validation: Form is valid!')
    return true
  }
  
  const isFormValid = () => {
    return isFormValidCheck(form)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Instructor</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Instructor</DialogTitle>
          <DialogDescription>Enter new instructor information.</DialogDescription>
        </DialogHeader>

        <form id="add-instructor-form" onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Input name="FirstName" placeholder="First Name" value={form.FirstName} onChange={handleChange} required />
            <Input name="LastName" placeholder="Last Name" value={form.LastName} onChange={handleChange} required />
          </div>
          <Input name="MiddleName" placeholder="Middle Name" value={form.MiddleName} onChange={handleChange} />
          <div>
            <Input 
              name="EmailAddress" 
              placeholder="example@cca.edu.ph" 
              type="email" 
              value={form.EmailAddress} 
              onChange={handleChange} 
              required 
              className={validationErrors.EmailAddress ? 'border-red-500' : ''}
            />
            {validationErrors.EmailAddress && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.EmailAddress}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input 
                  name="Password" 
                  placeholder="Password" 
                  type={showPassword ? "text" : "password"} 
                  value={form.Password} 
                  onChange={handleChange} 
                  required 
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setForm(prev => ({ ...prev, Password: '12345' }))}
                className="whitespace-nowrap flex-shrink-0"
              >
                Use Default
              </Button>
            </div>
          </div>
          <div>
            <Input 
              name="ContactNumber" 
              placeholder="Contact Number (09xxxxxxxxx)" 
              value={form.ContactNumber || ''} 
              onChange={handleChange} 
              required
              maxLength={11}
              className={validationErrors.ContactNumber ? 'border-red-500' : ''}
            />
            {validationErrors.ContactNumber && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.ContactNumber}</p>
            )}
          </div>
          
          <select
            name="Sex"
            value={form.Sex}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </form>

        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            type="submit"
            form="add-instructor-form"
            className="bg-green-900 text-white" 
            disabled={isSubmitting || !formValid}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
