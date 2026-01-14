import * as XLSX from 'xlsx';

/**
 * Generates a professionally formatted Excel template for student import
 * with styled headers, sample data, data validation, and instructions
 */
export function generateStudentImportTemplate(): Blob {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // ===== MAIN DATA SHEET =====
    const headers = [
        'StudentNumber',
        'FirstName',
        'MiddleName',
        'LastName',
        'EmailAddress',
        'Password',
        'ContactNumber',
        'Course',
        'YearLevel',
        'Section',
        'Sex',
        'IsPWD',
        'Status'
    ];

    // Pre-populate 8 sample rows without passwords (password field left empty)
    const sampleData: any[] = [
        ['2024-00001', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['2024-00002', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['2024-00003', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['2024-00004', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['2024-00005', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['2024-00006', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['2024-00007', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['2024-00008', '', '', '', '', '', '', '', '', '', '', '', '']
    ];

    // Create worksheet data with headers only
    const wsData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        { wch: 15 }, // StudentNumber
        { wch: 15 }, // FirstName
        { wch: 15 }, // MiddleName
        { wch: 15 }, // LastName
        { wch: 30 }, // EmailAddress
        { wch: 12 }, // Password
        { wch: 15 }, // ContactNumber
        { wch: 10 }, // Course
        { wch: 12 }, // YearLevel
        { wch: 10 }, // Section
        { wch: 8 },  // Sex
        { wch: 8 },  // IsPWD
        { wch: 10 }  // Status
    ];

    // Style the header row (A1:K1)
    const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
        fill: { fgColor: { rgb: '800020' } }, // Maroon background
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
        }
    };

    // Apply header styling
    for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = headerStyle;
    }

    // No sample data to style

    // Add the main sheet to workbook
    XLSX.utils.book_append_sheet(workbook, ws, 'Student Data');

    // ===== INSTRUCTIONS SHEET =====
    const instructionsData = [
        ['STUDENT IMPORT TEMPLATE - INSTRUCTIONS'],
        [''],
        ['Field Descriptions:'],
        [''],
        ['Field Name', 'Description', 'Required', 'Format/Options'],
        ['StudentNumber', 'Unique student identifier', 'Yes', 'e.g., 2024-00001'],
        ['FirstName', 'Student\'s first name', 'Yes', 'Text'],
        ['MiddleName', 'Student\'s middle name', 'No', 'Text (can be empty)'],
        ['LastName', 'Student\'s last name', 'Yes', 'Text'],
        ['EmailAddress', 'Valid email address', 'Yes', 'email@cca.edu.ph'],
        ['Password', 'Initial password', 'No', 'Leave empty for default: 12345'],
        ['ContactNumber', 'Phone number', 'No', 'e.g., 09123456789'],
        ['Course', 'Course code', 'Yes', 'BSIT, BSCS, BSIS, etc.'],
        ['YearLevel', 'Year level (1-4)', 'Yes', '1, 2, 3, or 4'],
        ['Section', 'Section letter', 'Yes', 'A, B, C, etc.'],
        ['Sex', 'Student gender', 'No', 'Male or Female (default: Male)'],
        ['IsPWD', 'Person with Disability', 'No', 'Yes or No (default: No)'],
        ['Status', 'Student status', 'No', 'active or inactive (default: active)'],
        [''],
        ['Important Notes:'],
        ['• Add your student data starting from row 2 (below the header row)'],
        ['• Ensure all required fields are filled in'],
        ['• StudentNumber must be unique for each student'],
        ['\u2022 EmailAddress must be unique and in valid email format (preferably @cca.edu.ph)'],
        ['\u2022 Duplicate emails or student numbers will be skipped during import'],
        ['• Do not modify the header row (first row)'],
        ['• Save the file after filling in your data'],
        ['• Use the "Import Students" button to upload this file'],
        [''],
        ['Common Course Codes:'],
        ['BSIT - Bachelor of Science in Information Technology'],
        ['BSCS - Bachelor of Science in Computer Science'],
        ['BSIS - Bachelor of Science in Information Systems'],
        ['ACT - Associate in Computer Technology'],
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);

    // Set column widths for instructions
    wsInstructions['!cols'] = [
        { wch: 20 },
        { wch: 50 },
        { wch: 12 },
        { wch: 30 }
    ];

    // Style the title
    if (wsInstructions['A1']) {
        wsInstructions['A1'].s = {
            font: { bold: true, sz: 16, color: { rgb: '800020' } },
            alignment: { horizontal: 'left', vertical: 'center' }
        };
    }

    // Style the "Field Descriptions:" header
    if (wsInstructions['A3']) {
        wsInstructions['A3'].s = {
            font: { bold: true, sz: 14, color: { rgb: '1F2937' } },
            alignment: { horizontal: 'left', vertical: 'center' }
        };
    }

    // Style the table header row (row 5)
    const instructionHeaderStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '374151' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
        }
    };

    for (let col = 0; col < 4; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 4, c: col });
        if (!wsInstructions[cellAddress]) continue;
        wsInstructions[cellAddress].s = instructionHeaderStyle;
    }

    // Style the field description rows (rows 6-16)
    for (let row = 5; row <= 15; row++) {
        const isEvenRow = (row - 5) % 2 === 0;
        const rowStyle = {
            fill: { fgColor: { rgb: isEvenRow ? 'F9FAFB' : 'FFFFFF' } },
            border: {
                top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                right: { style: 'thin', color: { rgb: 'E5E7EB' } }
            },
            alignment: { vertical: 'center' }
        };

        for (let col = 0; col < 4; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!wsInstructions[cellAddress]) continue;
            wsInstructions[cellAddress].s = rowStyle;
        }
    }

    // Style "Important Notes:" header
    if (wsInstructions['A18']) {
        wsInstructions['A18'].s = {
            font: { bold: true, sz: 12, color: { rgb: 'DC2626' } },
            alignment: { horizontal: 'left', vertical: 'center' }
        };
    }

    // Style "Common Course Codes:" header
    if (wsInstructions['A26']) {
        wsInstructions['A26'].s = {
            font: { bold: true, sz: 12, color: { rgb: '059669' } },
            alignment: { horizontal: 'left', vertical: 'center' }
        };
    }

    // Add instructions sheet to workbook
    XLSX.utils.book_append_sheet(workbook, wsInstructions, 'Instructions');

    // Generate Excel file as binary
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Create blob
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    return blob;
}

/**
 * Triggers download of the student import template
 */
export function downloadStudentImportTemplate(): void {
    const blob = generateStudentImportTemplate();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_import_template.xlsx';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
