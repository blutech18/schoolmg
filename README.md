# School Management System

A comprehensive web-based school management system built with Next.js, TypeScript, and MySQL. This system provides role-based access control for administrators, deans, program coordinators, instructors, and students to manage academic operations.

## 🚀 Features

### Role-Based Access Control
- **Admin**: Full system access - manage users, subjects, attendance, and grades
- **Dean**: Monitor student performance, view attendance and grading per subject
- **Program Coordinator**: View excuse letters and approve/decline them; monitor student data
- **Instructor**: Access assigned subjects; manage attendance and grades
- **Student**: View own grades, attendance, and submit excuse letters

### Core Modules

#### Student Management
- Add, edit, and manage student records
- View student enrollment information
- Track student academic progress

#### Instructor Management
- Manage instructor profiles
- Assign instructors to subjects and schedules

#### Attendance Management
- Record and track student attendance
- Support for multiple attendance statuses (Present, Absent, Excused, Late, etc.)
- Session-based attendance tracking
- Attendance analytics and statistics

#### Grade Management
- Flexible grading system with custom grading configurations
- Support for component-based grading (quizzes, assignments, exams)
- Term-based grade calculations
- Grade sheets and reporting

#### Schedule Management
- Create and manage class schedules
- Support for lecture and laboratory sessions
- Seat map visualization
- Schedule analytics

#### Subject Management
- Manage subject catalog
- Subject enrollment tracking
- Subject analytics

#### Course Management
- Course creation and management
- Course enrollment tracking
- Course analytics

#### Excuse Letters
- Student excuse letter submission
- File upload support (PDF, DOCX, images)
- Approval workflow for coordinators and deans

#### Analytics Dashboard
- Student performance analytics
- Attendance statistics
- Enrollment analytics
- Course and subject analytics
- Section-wise performance tracking

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Database**: MySQL (MySQL2)
- **Deployment**: Vercel
- **Database Hosting**: Railway

## 📋 Prerequisites

- Node.js 20 or higher
- npm or yarn
- MySQL database (local or hosted on Railway)
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/blutech18/schoolmg.git
   cd schoolmgtsystem-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DATABASE_URL="mysql://user:password@host:port/database"
   
   # Alternative format
   DB_HOST=your-db-host
   DB_PORT=3306
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=your-db-name
   
   # Next.js Configuration
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up the database**
   - Create a MySQL database
   - Import the database schema:
     ```bash
     npm run upload-db
     ```
     Or manually import `schoolmgtdb.sql` into your MySQL database

5. **Test database connection**
   ```bash
   npm run test-db
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Deploying to Vercel

1. **Connect your repository to Vercel**
   - Push your code to GitHub
   - Import the project in Vercel dashboard

2. **Configure environment variables in Vercel**
   - Go to Project Settings > Environment Variables
   - Add all the environment variables from your `.env` file:
     - `DATABASE_URL`
     - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (set to your Vercel deployment URL)

3. **Deploy**
   - Vercel will automatically deploy on every push to the main branch

### Database Setup on Railway

1. **Create a MySQL service on Railway**
   - Create a new project
   - Add a MySQL service
   - Note the connection details

2. **Upload the database schema**
   - Use the provided `upload-database.js` script:
     ```bash
     npm run upload-db
     ```
   - Or use Railway's MySQL service to import `schoolmgtdb.sql`

3. **Configure the connection**
   - Update `DATABASE_URL` in your Vercel environment variables with Railway's connection string

## 📜 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run upload-db` - Upload database schema to MySQL
- `npm run test-db` - Test database connection

## 📁 Project Structure

```
schoolmgtsystem-main/
├── app/                      # Next.js App Router pages and routes
│   ├── admin/               # Admin dashboard and pages
│   ├── dean/                # Dean dashboard and pages
│   ├── instructor/          # Instructor pages
│   ├── student/             # Student pages
│   ├── api/                 # API routes
│   ├── components/          # Shared components
│   └── lib/                 # Utility functions and database connection
├── components/              # UI components
│   └── ui/                 # Reusable UI components
├── helpers/                # Helper functions
├── hooks/                  # Custom React hooks
├── lib/                    # Library utilities
├── public/                 # Static assets
├── schoolmgtdb.sql         # Database schema
└── upload-database.js      # Database upload script
```

## 🔐 Default Credentials

After importing the database, you can use the default admin credentials to log in. Please change these credentials immediately after first login.

**Note**: Default credentials are stored in the database. Check the `users` table in your database for initial login credentials.

## 📊 Database Schema

The system uses MySQL with the following main tables:
- `users` - User accounts and authentication
- `students` - Student information
- `instructors` - Instructor information
- `subjects` - Subject catalog
- `schedules` - Class schedules
- `attendance` - Attendance records
- `grades` - Grade records
- `excuse_letters` - Excuse letter submissions
- `enrollments` - Student enrollments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🐛 Troubleshooting

### Database Connection Issues
- Verify your database credentials in `.env`
- Check if your database is accessible from your network
- For Railway: Ensure the database is publicly accessible

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 20+)

### API Errors
- Check Vercel deployment logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure database connection pool is properly configured

## 📧 Support

For issues and questions, please open an issue on GitHub or contact the development team.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for school management systems.

