# PeoplePay360

PeoplePay360 is a comprehensive HR and Payroll Management System designed to streamline employee management, time off tracking, attendance, and payroll processing for modern companies.

## Overview

This project is structured as a monorepo using [Turborepo](https://turbo.build/repo), allowing us to efficiently manage both the frontend and backend applications, along with shared database schemas and configurations.

### 🏢 Key Features
- **Company & Department Management**: Organize your organization structure easily.
- **Employee & Contract Management**: Maintain detailed employee records and manage employment contracts.
- **Time Tracking**: Manage working schedules, daily attendances, and overtime.
- **Time Off Management**: Handle time off allocations, requests, and multi-level approvals.
- **Payroll Processing**: Configure dynamic salary structures and rules, run payruns, and generate PDF payslips.

## Tech Stack

The application leverages a modern, high-performance tech stack powered by [Bun](https://bun.sh/).

### Frontend (`apps/frontend`)
- **Framework**: React 19 + React Router DOM
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Styling**: Tailwind CSS
- **Forms & Validation**: React Hook Form + Zod
- **Charts & Icons**: Recharts & Lucide React
- **Build Tool**: Bun

### Backend (`apps/backend`)
- **Runtime**: Bun (Node.js compatible)
- **Framework**: Express.js
- **Authentication**: JWT & bcryptjs
- **PDF Generation**: PDFKit (for Payslips)

### Database (`packages/db`)
- **ORM**: Prisma
- **Database**: PostgreSQL

## Types of Users (Roles)

PeoplePay360 supports role-based access control (RBAC) with the following user types:

- **Admin**: Full system access for configuration and management.
- **HR Manager**: Manages company structure, employees, and contracts.
- **Time Off Admin**: Specifically handles time off policies, allocations, and requests.
- **Payroll User**: Manages salary structures, executes payruns, and generates payslips.
- **Employee**: Can view their own profile, submit time-off requests, and download their payslips.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed on your machine
- PostgreSQL running locally or remotely

### Installation

1. **Install Dependencies**
   Run the following command at the root of the repository:
   ```sh
   bun install
   ```

2. **Database Setup**
   Configure your environment variables and run Prisma migrations:
   ```sh
   cd packages/db
   bunx prisma generate
   bunx prisma db push
   ```

3. **Start the Development Servers**
   From the root of the monorepo, you can start both the frontend and backend simultaneously:
   ```sh
   bun run dev
   ```

## Structure

- `apps/frontend`: The React frontend application.
- `apps/backend`: The Express.js backend API.
- `packages/db`: Shared Prisma database schema and generated client.
