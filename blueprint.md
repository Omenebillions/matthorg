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
*   **Sidebar Navigation:** A persistent sidebar provides easy access to all major sections of the application.
*   **Dashboard:** A central hub displaying key metrics and recent activity.

## Current Plan: Implement User Registration and Admin Role

To add the missing sign-up functionality and establish an owner role, I will implement the following:

*   **Goal:** Create a user registration flow where the first user of an organization becomes its administrator.
*   **Step 1:** Create a new registration page at `/signup` with a form to collect user details and a new organization's name.
*   **Step 2:** Develop a Server Action to handle the sign-up logic:
    *   Create the new user in Supabase Auth.
    *   Create a new organization associated with the user.
    *   Assign the user an 'owner' role and link them to the new organization.
*   **Step 3:** Update the login page to include a link to the new registration page.
*   **Step 4:** Secure the application by ensuring only the organization's owner (you) can invite new staff members.
