# Blueprint: MatthOrg Business Platform

## Overview

MatthOrg is an all-in-one platform to help businesses run their operations. It provides a centralized dashboard to manage staff, tasks, sales, projects, and more, aiming to streamline workflows and boost productivity.

## Style, Design, and Features

### Visual Design
*   **Palette:** Primary color is a vibrant blue (`#3B82F6`), complemented by a neutral gray scale for text and backgrounds.
*   **Typography:** Clean, modern sans-serif font.
*   **Layout:** Responsive design with a consistent sidebar navigation for main features and a main content area.
*   **Components:** Utilizes cards with shadows, clear iconography, and charts for data visualization.

### Core Features
*   **Authentication:** Secure login and user management handled by Supabase.
*   **Sidebar Navigation:** A persistent sidebar provides easy access to all major sections of the application:
    *   Dashboard
    *   Tasks & Milestones
    *   Jobs & Service Requests
    *   Sales & Revenue
    *   Staff Management
    *   Clock-ins
*   **Dashboard:** A central hub displaying key metrics and recent activity.

## Current Plan: Recreate and Consolidate Dashboard

To resolve a build error caused by conflicting files, I will create a single, unified dashboard.

*   **Goal:** Implement a functional and well-designed dashboard at the `/dashboard` route.
*   **Step 1:** Remove the conflicting dashboard files from the `app/` directory.
*   **Step 2:** Create a new dashboard layout at `src/app/dashboard/layout.tsx` to provide consistent navigation and structure.
*   **Step 3:** Create the main dashboard page at `src/app/dashboard/page.tsx` to display key business metrics and data visualizations.
*   **Step 4:** Verify the implementation by running the linter and checking for any errors.
