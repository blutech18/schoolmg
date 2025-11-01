// Print utility functions for generating print-optimized content
import React from 'react';

export interface PrintHeader {
  school: string;
  course: string;
  section: string;
  subject: string;
  instructor: string;
  date: string;
  semester?: string;
  academicYear?: string;
}

export const generatePrintHeader = (header: PrintHeader) => {
  return `
    <div class="print-header">
      <div class="print-header-main">
        <h1 class="print-school-name">${header.school}</h1>
        <h2 class="print-document-title">${header.subject}</h2>
      </div>
      <div class="print-header-details">
        <div class="print-header-row">
          <span class="print-label">Course:</span>
          <span class="print-value">${header.course}</span>
          <span class="print-label">Section:</span>
          <span class="print-value">${header.section}</span>
        </div>
        <div class="print-header-row">
          <span class="print-label">Instructor:</span>
          <span class="print-value">${header.instructor}</span>
          <span class="print-label">Date:</span>
          <span class="print-value">${header.date}</span>
        </div>
        ${header.semester ? `
        <div class="print-header-row">
          <span class="print-label">Semester:</span>
          <span class="print-value">${header.semester}</span>
          ${header.academicYear ? `
          <span class="print-label">Academic Year:</span>
          <span class="print-value">${header.academicYear}</span>
          ` : ''}
        </div>
        ` : ''}
      </div>
    </div>
  `;
};

export const generatePrintStyles = () => {
  return `
    <style>
      @media print {
        /* Reset and base styles */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: white !important;
        }
        
        /* Hide UI elements */
        .no-print,
        .print-hide,
        button,
        .btn,
        .button,
        .controls,
        .sidebar,
        .header,
        .navigation,
        .tabs,
        .modal,
        .dialog,
        .dropdown,
        .tooltip,
        [role="button"],
        input[type="button"],
        input[type="submit"] {
          display: none !important;
        }
        
        /* Print header styles */
        .print-header {
          border-bottom: 2px solid #000;
          margin-bottom: 15px;
          padding-bottom: 10px;
          page-break-after: avoid;
        }
        
        .print-header-main {
          text-align: center;
          margin-bottom: 10px;
        }
        
        .print-school-name {
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 8px 0;
          color: #000;
        }
        
        .print-document-title {
          font-size: 16px;
          font-weight: bold;
          margin: 0;
          color: #000;
        }
        
        .print-header-details {
          display: table;
          width: 100%;
          border-collapse: collapse;
        }
        
        .print-header-row {
          display: table-row;
        }
        
        .print-label,
        .print-value {
          display: table-cell;
          padding: 3px 8px;
          border: 1px solid #ccc;
          font-size: 11px;
        }
        
        .print-label {
          background-color: #f5f5f5;
          font-weight: bold;
          width: 15%;
        }
        
        .print-value {
          width: 35%;
        }
        
        /* Table styles */
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          page-break-inside: avoid;
        }
        
        .print-table th,
        .print-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: left;
          vertical-align: top;
          font-size: 11px;
        }
        
        .print-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        
        .print-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        /* Seat plan specific styles */
        .print-seat-plan {
          margin: 10px auto;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          page-break-inside: avoid;
        }
        
        .print-seat-grid {
          display: grid;
          gap: 2px;
          margin: 5px 0;
          justify-content: center;
        }
        
        .print-seat {
          width: 45px;
          height: 45px;
          border: 1px solid #000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          text-align: center;
          background-color: #fff;
          page-break-inside: avoid;
          margin: 1px;
        }
        
        .print-seat.assigned {
          background-color: #e8f5e8;
          border-color: #4caf50;
          border-width: 2px;
        }
        
        .print-seat-number {
          font-weight: bold;
          font-size: 10px;
          color: #000;
          margin-bottom: 1px;
        }
        
        .print-seat-student {
          font-size: 7px;
          line-height: 1.0;
          word-break: break-word;
          color: #2d5a2d;
          font-weight: 500;
          max-width: 40px;
          text-align: center;
        }
        
        /* Cisco room specific print styles */
        .print-seat-grid-cisco {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin: 8px 0;
        }
        
        .print-seat-group {
          display: flex;
          gap: 3px;
        }
        
        /* Lecture specific print styles */
        .print-seat-grid-lecture {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin: 10px 0;
          flex-wrap: nowrap;
        }
        
        .print-seat-column {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 0 0 auto;
        }
        
        /* Attendance specific styles */
        .print-attendance-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          page-break-inside: avoid;
        }
        
        .print-attendance-table th,
        .print-attendance-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          text-align: center;
          font-size: 10px;
        }
        
        .print-attendance-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .print-status {
          font-weight: bold;
          padding: 2px 4px;
          border-radius: 2px;
        }
        
        .print-status.present {
          background-color: #d4edda;
          color: #155724;
        }
        
        .print-status.absent {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .print-status.excused {
          background-color: #fff3cd;
          color: #856404;
        }
        
        .print-status.late {
          background-color: #d1ecf1;
          color: #0c5460;
        }
        
        .print-status.cancelled {
          background-color: #e2e3e5;
          color: #383d41;
        }
        
        /* Grading specific styles */
        .print-grading-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          page-break-inside: avoid;
        }
        
        .print-grading-table th,
        .print-grading-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          text-align: center;
          font-size: 10px;
        }
        
        .print-grading-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .print-grade {
          font-weight: bold;
          font-size: 11px;
        }
        
        /* Page breaks */
        .page-break {
          page-break-before: always;
        }
        
        .no-page-break {
          page-break-inside: avoid;
        }
        
        /* Footer */
        .print-footer {
          margin-top: 15px;
          padding-top: 8px;
          border-top: 1px solid #ccc;
          font-size: 9px;
          text-align: center;
          color: #666;
        }
        
        /* Ensure content fits on page */
        @page {
          margin: 0.5in;
          size: A4;
        }
        
        /* Landscape orientation for wide tables */
        @page landscape {
          size: A4 landscape;
          margin: 0.4in;
        }
        
        /* Hide scrollbars */
        ::-webkit-scrollbar {
          display: none;
        }
      }
      
      /* Screen styles for print preview */
      .print-preview {
        max-width: 210mm;
        margin: 0 auto;
        padding: 20mm;
        background: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #000;
      }
      
      .print-preview .print-header {
        border-bottom: 2px solid #000;
        margin-bottom: 20px;
        padding-bottom: 15px;
      }
      
      .print-preview .print-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      .print-preview .print-table th,
      .print-preview .print-table td {
        border: 1px solid #000;
        padding: 6px 8px;
        text-align: left;
        vertical-align: top;
        font-size: 11px;
      }
      
      .print-preview .print-table th {
        background-color: #f0f0f0;
        font-weight: bold;
        text-align: center;
      }
    </style>
  `;
};

export const printDocument = (content: string, title: string = 'Document') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      ${generatePrintStyles()}
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
};

export const generateSeatPlanPrintContent = (
  schedule: any,
  seatAssignments: {[key: number]: number},
  students: any[],
  seatType: 'lecture' | 'laboratory' = 'lecture'
) => {
  const header = generatePrintHeader({
    school: 'College Name',
    course: schedule.Course || 'N/A',
    section: schedule.Section || 'N/A',
    subject: `${schedule.SubjectCode || 'N/A'} - ${schedule.SubjectTitle || 'N/A'}`,
    instructor: schedule.InstructorName || 'N/A',
    date: new Date().toLocaleDateString(),
    semester: schedule.Semester || 'N/A',
    academicYear: schedule.AcademicYear || 'N/A'
  });

  // Cisco room specific layout configuration
  let cols: number;
  if (schedule.isCiscoRoom) {
    // Cisco room: 2 columns with 4 seats each (8 seats per row)
    cols = 2;
  } else {
    // Standard room layout
    if (seatType === 'lecture') {
      // Lecture: 4 columns with 2 seats per column (8 seats per row)
      cols = 4;
    } else {
      // Laboratory: use configured columns or default
      cols = schedule.LaboratorySeatCols || schedule.SeatCols || 5;
    }
  }
  
  const totalSeats = schedule.TotalSeats || 0;
  
  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.StudentID === studentId);
    if (!student) return 'Unknown';
    
    // Handle different name formats
    if (student.FirstName && student.LastName) {
      return `${student.FirstName} ${student.LastName}`;
    } else if (student.StudentName) {
      return student.StudentName;
    } else {
      return 'Unknown';
    }
  };

  // Calculate rows based on seat type
  const rows = schedule.isCiscoRoom ? Math.ceil(totalSeats / 8) : 
               (seatType === 'lecture' ? 5 : Math.ceil(totalSeats / cols));
  const seatGrid = Array.from({ length: rows }, (_, rowIndex) => {
    if (schedule.isCiscoRoom) {
      // Cisco room layout: 4 columns with 2 seats per column (8 seats per row) - Same as Lecture
      const seat1Number = rowIndex * 8 + 1;
      const seat2Number = rowIndex * 8 + 2;
      const seat3Number = rowIndex * 8 + 3;
      const seat4Number = rowIndex * 8 + 4;
      const seat5Number = rowIndex * 8 + 5;
      const seat6Number = rowIndex * 8 + 6;
      const seat7Number = rowIndex * 8 + 7;
      const seat8Number = rowIndex * 8 + 8;
      
      const seat1AssignedId = seatAssignments[seat1Number - 1];
      const seat2AssignedId = seatAssignments[seat2Number - 1];
      const seat3AssignedId = seatAssignments[seat3Number - 1];
      const seat4AssignedId = seatAssignments[seat4Number - 1];
      const seat5AssignedId = seatAssignments[seat5Number - 1];
      const seat6AssignedId = seatAssignments[seat6Number - 1];
      const seat7AssignedId = seatAssignments[seat7Number - 1];
      const seat8AssignedId = seatAssignments[seat8Number - 1];
      
      const seat1Assigned = seat1AssignedId && seat1AssignedId !== 0;
      const seat2Assigned = seat2AssignedId && seat2AssignedId !== 0;
      const seat3Assigned = seat3AssignedId && seat3AssignedId !== 0;
      const seat4Assigned = seat4AssignedId && seat4AssignedId !== 0;
      const seat5Assigned = seat5AssignedId && seat5AssignedId !== 0;
      const seat6Assigned = seat6AssignedId && seat6AssignedId !== 0;
      const seat7Assigned = seat7AssignedId && seat7AssignedId !== 0;
      const seat8Assigned = seat8AssignedId && seat8AssignedId !== 0;
      
      return `
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <tr>
            <td style="width: 25%; padding: 8px; vertical-align: top;">
              <div style="display: flex; gap: 3px;">
                ${seat1Number <= totalSeats ? `
                  <div class="print-seat ${seat1Assigned ? 'assigned' : ''}">
                    <div class="print-seat-number">${seat1Number}</div>
                    ${seat1Assigned ? `<div class="print-seat-student">${getStudentName(seat1AssignedId)}</div>` : ''}
                  </div>
                ` : ''}
                ${seat2Number <= totalSeats ? `
                  <div class="print-seat ${seat2Assigned ? 'assigned' : ''}">
                    <div class="print-seat-number">${seat2Number}</div>
                    ${seat2Assigned ? `<div class="print-seat-student">${getStudentName(seat2AssignedId)}</div>` : ''}
                  </div>
                ` : ''}
              </div>
            </td>
            <td style="width: 25%; padding: 8px; vertical-align: top;">
              <div style="display: flex; gap: 3px;">
                ${seat3Number <= totalSeats ? `
                  <div class="print-seat ${seat3Assigned ? 'assigned' : ''}">
                    <div class="print-seat-number">${seat3Number}</div>
                    ${seat3Assigned ? `<div class="print-seat-student">${getStudentName(seat3AssignedId)}</div>` : ''}
                  </div>
                ` : ''}
                ${seat4Number <= totalSeats ? `
                  <div class="print-seat ${seat4Assigned ? 'assigned' : ''}">
                    <div class="print-seat-number">${seat4Number}</div>
                    ${seat4Assigned ? `<div class="print-seat-student">${getStudentName(seat4AssignedId)}</div>` : ''}
                  </div>
                ` : ''}
              </div>
            </td>
            <td style="width: 25%; padding: 8px; vertical-align: top;">
              <div style="display: flex; gap: 3px;">
                ${seat5Number <= totalSeats ? `
                  <div class="print-seat ${seat5Assigned ? 'assigned' : ''}">
                    <div class="print-seat-number">${seat5Number}</div>
                    ${seat5Assigned ? `<div class="print-seat-student">${getStudentName(seat5AssignedId)}</div>` : ''}
                  </div>
                ` : ''}
                ${seat6Number <= totalSeats ? `
                  <div class="print-seat ${seat6Assigned ? 'assigned' : ''}">
                    <div class="print-seat-number">${seat6Number}</div>
                    ${seat6Assigned ? `<div class="print-seat-student">${getStudentName(seat6AssignedId)}</div>` : ''}
                  </div>
                ` : ''}
              </div>
            </td>
            <td style="width: 25%; padding: 8px; vertical-align: top;">
              <div style="display: flex; gap: 3px;">
                ${seat7Number <= totalSeats ? `
                  <div class="print-seat ${seat7Assigned ? 'assigned' : ''}">
                    <div class="print-seat-number">${seat7Number}</div>
                    ${seat7Assigned ? `<div class="print-seat-student">${getStudentName(seat7AssignedId)}</div>` : ''}
                  </div>
                ` : ''}
                ${seat8Number <= totalSeats ? `
                  <div class="print-seat ${seat8Assigned ? 'assigned' : ''}">
                    <div class="print-seat-number">${seat8Number}</div>
                    ${seat8Assigned ? `<div class="print-seat-student">${getStudentName(seat8AssignedId)}</div>` : ''}
                  </div>
                ` : ''}
              </div>
            </td>
          </tr>
        </table>
      `;
    } else {
      // Standard room layout
       if (seatType === 'lecture') {
         // Lecture: 4 columns with 2 seats per column (8 seats per row)
         const seat1Number = rowIndex * 8 + 1;
         const seat2Number = rowIndex * 8 + 2;
         const seat3Number = rowIndex * 8 + 3;
         const seat4Number = rowIndex * 8 + 4;
         const seat5Number = rowIndex * 8 + 5;
         const seat6Number = rowIndex * 8 + 6;
         const seat7Number = rowIndex * 8 + 7;
         const seat8Number = rowIndex * 8 + 8;
         
         const seat1AssignedId = seatAssignments[seat1Number - 1];
         const seat2AssignedId = seatAssignments[seat2Number - 1];
         const seat3AssignedId = seatAssignments[seat3Number - 1];
         const seat4AssignedId = seatAssignments[seat4Number - 1];
         const seat5AssignedId = seatAssignments[seat5Number - 1];
         const seat6AssignedId = seatAssignments[seat6Number - 1];
         const seat7AssignedId = seatAssignments[seat7Number - 1];
         const seat8AssignedId = seatAssignments[seat8Number - 1];
         
         const seat1Assigned = seat1AssignedId && seat1AssignedId !== 0;
         const seat2Assigned = seat2AssignedId && seat2AssignedId !== 0;
         const seat3Assigned = seat3AssignedId && seat3AssignedId !== 0;
         const seat4Assigned = seat4AssignedId && seat4AssignedId !== 0;
         const seat5Assigned = seat5AssignedId && seat5AssignedId !== 0;
         const seat6Assigned = seat6AssignedId && seat6AssignedId !== 0;
         const seat7Assigned = seat7AssignedId && seat7AssignedId !== 0;
         const seat8Assigned = seat8AssignedId && seat8AssignedId !== 0;
        
        return `
           <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
             <tr>
                <td style="width: 25%; padding: 8px; vertical-align: top;">
                 <div style="display: flex; gap: 3px;">
                   ${seat1Number <= totalSeats ? `
                     <div class="print-seat ${seat1Assigned ? 'assigned' : ''}">
                       <div class="print-seat-number">${seat1Number}</div>
                       ${seat1Assigned ? `<div class="print-seat-student">${getStudentName(seat1AssignedId)}</div>` : ''}
          </div>
                   ` : ''}
                   ${seat2Number <= totalSeats ? `
                     <div class="print-seat ${seat2Assigned ? 'assigned' : ''}">
                       <div class="print-seat-number">${seat2Number}</div>
                       ${seat2Assigned ? `<div class="print-seat-student">${getStudentName(seat2AssignedId)}</div>` : ''}
                     </div>
                   ` : ''}
                 </div>
               </td>
                <td style="width: 25%; padding: 8px; vertical-align: top;">
                 <div style="display: flex; gap: 3px;">
                   ${seat3Number <= totalSeats ? `
                     <div class="print-seat ${seat3Assigned ? 'assigned' : ''}">
                       <div class="print-seat-number">${seat3Number}</div>
                       ${seat3Assigned ? `<div class="print-seat-student">${getStudentName(seat3AssignedId)}</div>` : ''}
                     </div>
                   ` : ''}
                   ${seat4Number <= totalSeats ? `
                     <div class="print-seat ${seat4Assigned ? 'assigned' : ''}">
                       <div class="print-seat-number">${seat4Number}</div>
                       ${seat4Assigned ? `<div class="print-seat-student">${getStudentName(seat4AssignedId)}</div>` : ''}
                     </div>
                   ` : ''}
                 </div>
               </td>
                <td style="width: 25%; padding: 8px; vertical-align: top;">
                 <div style="display: flex; gap: 3px;">
                   ${seat5Number <= totalSeats ? `
                     <div class="print-seat ${seat5Assigned ? 'assigned' : ''}">
                       <div class="print-seat-number">${seat5Number}</div>
                       ${seat5Assigned ? `<div class="print-seat-student">${getStudentName(seat5AssignedId)}</div>` : ''}
                     </div>
                   ` : ''}
                   ${seat6Number <= totalSeats ? `
                     <div class="print-seat ${seat6Assigned ? 'assigned' : ''}">
                       <div class="print-seat-number">${seat6Number}</div>
                       ${seat6Assigned ? `<div class="print-seat-student">${getStudentName(seat6AssignedId)}</div>` : ''}
                     </div>
                   ` : ''}
                 </div>
               </td>
                <td style="width: 25%; padding: 8px; vertical-align: top;">
                 <div style="display: flex; gap: 3px;">
                   ${seat7Number <= totalSeats ? `
                     <div class="print-seat ${seat7Assigned ? 'assigned' : ''}">
                       <div class="print-seat-number">${seat7Number}</div>
                       ${seat7Assigned ? `<div class="print-seat-student">${getStudentName(seat7AssignedId)}</div>` : ''}
                     </div>
                   ` : ''}
                   ${seat8Number <= totalSeats ? `
                     <div class="print-seat ${seat8Assigned ? 'assigned' : ''}">
                       <div class="print-seat-number">${seat8Number}</div>
                       ${seat8Assigned ? `<div class="print-seat-student">${getStudentName(seat8AssignedId)}</div>` : ''}
                     </div>
                   ` : ''}
                 </div>
               </td>
             </tr>
           </table>
         `;
        } else {
          // Laboratory: 8 seats per row with 4-4 arrangement
          const seat1Number = rowIndex * 8 + 1;
          const seat2Number = rowIndex * 8 + 2;
          const seat3Number = rowIndex * 8 + 3;
          const seat4Number = rowIndex * 8 + 4;
          const seat5Number = rowIndex * 8 + 5;
          const seat6Number = rowIndex * 8 + 6;
          const seat7Number = rowIndex * 8 + 7;
          const seat8Number = rowIndex * 8 + 8;
          
          const seat1AssignedId = seatAssignments[seat1Number - 1];
          const seat2AssignedId = seatAssignments[seat2Number - 1];
          const seat3AssignedId = seatAssignments[seat3Number - 1];
          const seat4AssignedId = seatAssignments[seat4Number - 1];
          const seat5AssignedId = seatAssignments[seat5Number - 1];
          const seat6AssignedId = seatAssignments[seat6Number - 1];
          const seat7AssignedId = seatAssignments[seat7Number - 1];
          const seat8AssignedId = seatAssignments[seat8Number - 1];
          
          const seat1Assigned = seat1AssignedId && seat1AssignedId !== 0;
          const seat2Assigned = seat2AssignedId && seat2AssignedId !== 0;
          const seat3Assigned = seat3AssignedId && seat3AssignedId !== 0;
          const seat4Assigned = seat4AssignedId && seat4AssignedId !== 0;
          const seat5Assigned = seat5AssignedId && seat5AssignedId !== 0;
          const seat6Assigned = seat6AssignedId && seat6AssignedId !== 0;
          const seat7Assigned = seat7AssignedId && seat7AssignedId !== 0;
          const seat8Assigned = seat8AssignedId && seat8AssignedId !== 0;
          
          return `
            <table style="width: 100%; border-collapse: collapse; margin: 5px 0;">
              <tr>
                <td style="width: 50%; padding: 8px; vertical-align: top;">
                  <div style="display: flex; gap: 5px;">
                    ${seat1Number <= totalSeats ? `
                      <div class="print-seat ${seat1Assigned ? 'assigned' : ''}">
                        <div class="print-seat-number">${seat1Number}</div>
                        ${seat1Assigned ? `<div class="print-seat-student">${getStudentName(seat1AssignedId)}</div>` : ''}
                      </div>
                    ` : ''}
                    ${seat2Number <= totalSeats ? `
                      <div class="print-seat ${seat2Assigned ? 'assigned' : ''}">
                        <div class="print-seat-number">${seat2Number}</div>
                        ${seat2Assigned ? `<div class="print-seat-student">${getStudentName(seat2AssignedId)}</div>` : ''}
                      </div>
                    ` : ''}
                    ${seat3Number <= totalSeats ? `
                      <div class="print-seat ${seat3Assigned ? 'assigned' : ''}">
                        <div class="print-seat-number">${seat3Number}</div>
                        ${seat3Assigned ? `<div class="print-seat-student">${getStudentName(seat3AssignedId)}</div>` : ''}
                      </div>
                    ` : ''}
                    ${seat4Number <= totalSeats ? `
                      <div class="print-seat ${seat4Assigned ? 'assigned' : ''}">
                        <div class="print-seat-number">${seat4Number}</div>
                        ${seat4Assigned ? `<div class="print-seat-student">${getStudentName(seat4AssignedId)}</div>` : ''}
                      </div>
                    ` : ''}
                  </div>
                </td>
                <td style="width: 50%; padding: 8px; vertical-align: top;">
                  <div style="display: flex; gap: 5px;">
                    ${seat5Number <= totalSeats ? `
                      <div class="print-seat ${seat5Assigned ? 'assigned' : ''}">
                        <div class="print-seat-number">${seat5Number}</div>
                        ${seat5Assigned ? `<div class="print-seat-student">${getStudentName(seat5AssignedId)}</div>` : ''}
                      </div>
                    ` : ''}
                    ${seat6Number <= totalSeats ? `
                      <div class="print-seat ${seat6Assigned ? 'assigned' : ''}">
                        <div class="print-seat-number">${seat6Number}</div>
                        ${seat6Assigned ? `<div class="print-seat-student">${getStudentName(seat6AssignedId)}</div>` : ''}
                      </div>
                    ` : ''}
                    ${seat7Number <= totalSeats ? `
                      <div class="print-seat ${seat7Assigned ? 'assigned' : ''}">
                        <div class="print-seat-number">${seat7Number}</div>
                        ${seat7Assigned ? `<div class="print-seat-student">${getStudentName(seat7AssignedId)}</div>` : ''}
                      </div>
                    ` : ''}
                    ${seat8Number <= totalSeats ? `
                      <div class="print-seat ${seat8Assigned ? 'assigned' : ''}">
                        <div class="print-seat-number">${seat8Number}</div>
                        ${seat8Assigned ? `<div class="print-seat-student">${getStudentName(seat8AssignedId)}</div>` : ''}
                      </div>
                    ` : ''}
                  </div>
                </td>
              </tr>
            </table>
          `;
        }
    }
  }).join('');

  // Determine display class type for print
  const displayClassType = schedule.ClassType === 'MAJOR' ? 'CISCO' : 
                          (schedule.ClassType === 'LECTURE+LABORATORY' || schedule.ClassType === 'LECTURE+LAB') ? 'LECTURE+LABORATORY' :
                          (seatType === 'lecture' ? 'Lecture' : 'Laboratory');

  return `
    ${header}
    <div class="print-seat-plan">
      <h3>${displayClassType} Seat Plan</h3>
      <div class="no-page-break">
        ${seatGrid}
      </div>
      
      <!-- Legend -->
      <div style="margin-top: 10px; padding: 8px; border: 1px solid #ccc; background-color: #f9f9f9;">
        <h4 style="margin: 0 0 5px 0; font-size: 10px;">Legend:</h4>
        <div style="display: flex; gap: 15px; font-size: 8px;">
          <div style="display: flex; align-items: center; gap: 3px;">
            <div style="width: 15px; height: 15px; border: 2px solid #4caf50; background-color: #e8f5e8;"></div>
            <span>Assigned Seat</span>
          </div>
          <div style="display: flex; align-items: center; gap: 3px;">
            <div style="width: 15px; height: 15px; border: 1px solid #000; background-color: #fff;"></div>
            <span>Available Seat</span>
          </div>
        </div>
      </div>
    </div>
    <div class="print-footer">
      <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
  `;
};

export const generateAttendancePrintContent = (
  schedule: any,
  students: any[],
  attendanceData: {[key: string]: {[sessionNumber: number]: string}},
  sessionType: 'lecture' | 'lab' = 'lecture',
  sessionNumber: number = 1
) => {
  const header = generatePrintHeader({
    school: 'College Name',
    course: schedule.Course || 'N/A',
    section: schedule.Section || 'N/A',
    subject: `${schedule.SubjectCode || 'N/A'} - ${schedule.SubjectTitle || 'N/A'}`,
    instructor: schedule.InstructorName || 'N/A',
    date: new Date().toLocaleDateString(),
    semester: schedule.Semester || 'N/A',
    academicYear: schedule.AcademicYear || 'N/A'
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'P': { class: 'present', text: 'Present' },
      'A': { class: 'absent', text: 'Absent' },
      'E': { class: 'excused', text: 'Excused' },
      'L': { class: 'late', text: 'Late' },
      'CC': { class: 'cancelled', text: 'Cancelled' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { class: 'absent', text: 'Unknown' };
    return `<span class="print-status ${statusInfo.class}">${statusInfo.text}</span>`;
  };

  const attendanceRows = students.map(student => {
    const studentKey = `${student.StudentID}`;
    const status = attendanceData[studentKey]?.[sessionNumber] || 'A';
    
    return `
      <tr>
        <td>${student.FirstName} ${student.LastName}</td>
        <td>${student.StudentNumber}</td>
        <td>${student.Course}</td>
        <td>${student.YearLevel}</td>
        <td>${getStatusBadge(status)}</td>
        <td></td>
      </tr>
    `;
  }).join('');

  return `
    ${header}
    <div class="no-page-break">
      <h3>${sessionType === 'lecture' ? 'Lecture' : 'Laboratory'} Attendance - Session ${sessionNumber}</h3>
      <table class="print-attendance-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Student Number</th>
            <th>Course</th>
            <th>Year Level</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceRows}
        </tbody>
      </table>
    </div>
    <div class="print-footer">
      <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
  `;
};

export const generateGradingPrintContent = (
  schedule: any,
  students: any[],
  grades: any[],
  gradingConfig: any,
  term: 'midterm' | 'final' = 'midterm'
) => {
  const header = generatePrintHeader({
    school: 'College Name',
    course: schedule.Course || 'N/A',
    section: schedule.Section || 'N/A',
    subject: `${schedule.SubjectCode || 'N/A'} - ${schedule.SubjectTitle || 'N/A'}`,
    instructor: schedule.InstructorName || 'N/A',
    date: new Date().toLocaleDateString(),
    semester: schedule.Semester || 'N/A',
    academicYear: schedule.AcademicYear || 'N/A'
  });

  const getGradeForStudent = (studentId: number, componentName: string, itemNumber: number) => {
    const grade = grades.find(g => 
      g.StudentID === studentId && 
      g.ComponentName === componentName && 
      g.ItemNumber === itemNumber &&
      g.Term === term
    );
    return grade ? grade.Score || '' : '';
  };

  const getFinalGrade = (studentId: number) => {
    const finalGrade = grades.find(g => 
      g.StudentID === studentId && 
      g.ComponentName === 'Final Grade' &&
      g.Term === term
    );
    return finalGrade ? finalGrade.Score || '' : '';
  };

  // Generate component headers
  const componentHeaders = gradingConfig?.components?.map((component: any) => 
    Array.from({ length: component.items }, (_, index) => 
      `<th>${component.name} ${index + 1}</th>`
    ).join('')
  ).join('') || '';

  // Generate grade rows
  const gradeRows = students.map(student => {
    const componentGrades = gradingConfig?.components?.map((component: any) =>
      Array.from({ length: component.items }, (_, index) => {
        const grade = getGradeForStudent(student.StudentID, component.name, index + 1);
        return `<td>${grade}</td>`;
      }).join('')
    ).join('') || '';

    const finalGrade = getFinalGrade(student.StudentID);

    return `
      <tr>
        <td>${student.FirstName} ${student.LastName}</td>
        <td>${student.StudentNumber}</td>
        ${componentGrades}
        <td class="print-grade">${finalGrade}</td>
      </tr>
    `;
  }).join('');

  return `
    ${header}
    <div class="no-page-break">
      <h3>Grading Sheet - ${term.charAt(0).toUpperCase() + term.slice(1)} Term</h3>
      <table class="print-grading-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Student No.</th>
            ${componentHeaders}
            <th>Final Grade</th>
          </tr>
        </thead>
        <tbody>
          ${gradeRows}
        </tbody>
      </table>
    </div>
    <div class="print-footer">
      <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
  `;
};

// Enhanced print functionality for tables
export interface EnhancedPrintOptions {
  title: string;
  subtitle: string;
  department: string;
  academicYear: string;
  semester: string;
  additionalInfo?: { [key: string]: string };
}

export const enhancedPrint = (tableRef: React.RefObject<HTMLTableElement | null> | null, options: EnhancedPrintOptions) => {
  if (!tableRef?.current) {
    alert('Table not ready for printing.');
    return;
  }

  const table = tableRef.current;
  const tableClone = table.cloneNode(true) as HTMLTableElement;
  
  // Remove action columns (buttons, etc.)
  const actionHeaders = tableClone.querySelectorAll('th.no-print, th[class*="action"]');
  actionHeaders.forEach(header => {
    const columnIndex = Array.from(header.parentElement?.children || []).indexOf(header);
    if (columnIndex !== -1) {
      // Remove header
      header.remove();
      // Remove corresponding cells in all rows
      tableClone.querySelectorAll('tr').forEach(row => {
        const cells = row.children;
        if (cells[columnIndex]) {
          cells[columnIndex].remove();
        }
      });
    }
  });

  // Remove action cells
  tableClone.querySelectorAll('td.no-print, td[class*="action"]').forEach(cell => cell.remove());

  const additionalInfoRows = options.additionalInfo ? 
    Object.entries(options.additionalInfo).map(([key, value]) => 
      `<tr><td class="print-label">${key}:</td><td class="print-value">${value}</td></tr>`
    ).join('') : '';

  const content = `
    <div class="print-header">
      <div class="print-header-main">
        <h1 class="print-school-name">College Name</h1>
        <h2 class="print-document-title">${options.title}</h2>
        <h3 class="print-document-subtitle">${options.subtitle}</h3>
      </div>
      <div class="print-header-details">
        <div class="print-header-row">
          <span class="print-label">Department:</span>
          <span class="print-value">${options.department}</span>
          <span class="print-label">Academic Year:</span>
          <span class="print-value">${options.academicYear}</span>
        </div>
        <div class="print-header-row">
          <span class="print-label">Semester:</span>
          <span class="print-value">${options.semester}</span>
          <span class="print-label">Date:</span>
          <span class="print-value">${new Date().toLocaleDateString()}</span>
        </div>
        ${additionalInfoRows ? `
        <div class="print-header-details">
          ${additionalInfoRows}
        </div>
        ` : ''}
      </div>
    </div>
    <div class="print-content">
      ${tableClone.outerHTML}
    </div>
    <div class="print-footer">
      <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
  `;

  printDocument(content, options.title);
};

// Academic year and semester utilities
export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed months
  
  // Academic year typically runs from June to May
  // If current month is June or later, we're in the new academic year
  if (currentMonth >= 6) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
};

export const getCurrentSemester = (): string => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 0-indexed months
  
  // First semester: June to October
  // Second semester: November to March
  // Summer: April to May
  if (currentMonth >= 6 && currentMonth <= 10) {
    return '1st Semester';
  } else if (currentMonth >= 11 || currentMonth <= 3) {
    return '2nd Semester';
  } else {
    return 'Summer';
  }
};