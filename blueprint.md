
# MattHorg - SaaS Business Management Platform

## Overview

This document outlines the architecture and features of MattHorg, a comprehensive SaaS platform designed to help businesses manage their operations, staff, and finances. The platform is built on a multi-tenant architecture, providing each organization with a secure and isolated environment.

## Core Features

### 1. Multi-Tenant Architecture
- Each organization receives a unique subdomain (e.g., `my-business.matthorg.com`).
- Data is securely partitioned to ensure that each organization can only access its own information.

### 2. CEO Dashboard
- A real-time, centralized dashboard that provides a high-level overview of the entire business.
- Key metrics include:
    - Number of open tasks.
    - Number of jobs in progress.
    - Recent sales activity.
    - Staff attendance.

### 3. Tasks & Milestones
- **Create, Edit, and Delete Tasks:** Users can create, update, and remove tasks.
- **Assign Tasks:** Tasks can be assigned to specific staff members.
- **Set Due Dates and Statuses:** Each task can have a due date and a status (e.g., "Pending," "In Progress," "Completed").
- **Define Milestones:** Managers can create project milestones to group related tasks.

### 4. Jobs & Service Requests
- **Create, Edit, and Delete Jobs:** Users can log, update, and remove client jobs.
- **Track Job Status:** Jobs can be tracked through various stages (e.g., "Scheduled," "In Progress," "Completed").
- **Assign Jobs:** Jobs can be assigned to one or more staff members.

### 5. Sales & Revenue Management
- **Log Sales:** Users can record new sales, including the item sold and the amount.
- **Transaction History:** A comprehensive list of all sales transactions is available.

### 6. Staff Management
- **Invite Staff:** Managers can send email invitations to new users.
- **Team Overview:** A centralized view of all staff members in the organization.
- **360-Degree Staff Profiles:** Detailed profiles for each staff member, showing their assigned tasks and jobs.

### 7. Clock-in / Attendance
- **Simple Clock-in/Clock-out:** Staff can easily clock in and out to record their work hours.
- **Live Attendance Log:** A real-time view of who is currently clocked in and their attendance history for the day.

## Design and UI/UX

- **Modern and Intuitive:** The platform features a clean, modern design with a focus on ease of use.
- **Responsive:** The UI is fully responsive and works seamlessly on both desktop and mobile devices.
- **Consistent Navigation:** A consistent sidebar navigation is present across all modules, providing a predictable user experience.
