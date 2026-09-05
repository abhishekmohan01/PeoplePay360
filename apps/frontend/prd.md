# PeoplePay360 Frontend --- Product Requirements Document (PRD)

**Project:** PeoplePay360\
**Frontend location:** `apps/frontend/`\
**Repository:** Bun + Turborepo monorepo\
**Primary objective:** Build a production-ready HR & Payroll frontend
that closely reproduces the supplied UI references, provides complete
navigation and page flows, and integrates cleanly with the existing
backend.

------------------------------------------------------------------------

## 1. Product Overview

PeoplePay360 is an HR and Payroll application covering:

-   Authentication and user access
-   Employee management
-   Contracts
-   Working schedules
-   Attendance
-   Time Off
-   Allocations
-   Payroll configuration
-   Salary structures
-   Salary rules
-   Payruns
-   Payslips
-   Payroll analytics/dashboard

The frontend must behave as one consistent application rather than a
collection of disconnected screens.

### Core UX principle

Every screen should feel like it belongs to the same hand-drawn HR
product:

-   Handwritten typography
-   Dark, slightly warm visual treatment
-   Thin hand-drawn borders
-   Sketch-like diagrams and icons
-   Rounded cards and controls
-   Restrained use of blue/purple/green/orange/red accents
-   Handwritten notifications, alerts, helper text and empty states
-   Consistent spacing, radii, shadows and interaction patterns

The supplied screenshots are the visual source of truth for the UI
direction.

------------------------------------------------------------------------

# 2. Goals

## 2.1 Primary goals

1.  Reproduce the supplied UI style with high visual fidelity.
2.  Implement all screens represented in the references.
3.  Connect every frontend feature to backend APIs.
4.  Keep API contracts compatible with the existing backend.
5.  Create reusable UI primitives so all pages share one design system.
6.  Support responsive desktop/tablet layouts without breaking the
    visual language.
7.  Support light and dark themes.
8.  Implement complete navigation between related HR records.
9.  Implement loading, empty, error and success states for all
    API-driven views.
10. Keep authentication, authorization and role-based visibility
    enforced by the backend.

## 2.2 Non-goals

-   Rebuilding the backend.
-   Changing backend business rules solely to make the UI easier.
-   Creating independent mock-only versions of production pages.
-   Introducing unrelated design systems or component libraries that
    conflict with the supplied visual language.

------------------------------------------------------------------------

# 3. Reference UI Direction

The screenshots establish the following visual language.

## 3.1 Overall composition

Use:

-   Large page titles
-   Small handwritten subtitles/helper descriptions
-   Dark canvas
-   Thin outlined containers
-   Rounded corners
-   Dense but readable data tables
-   Compact filters
-   Blue primary actions
-   Purple active navigation states
-   Green success states
-   Orange warning states
-   Red destructive/error states
-   Small status badges
-   Handwritten annotations where useful

Avoid:

-   Heavy gradients
-   Corporate dashboard templates
-   Excessive glassmorphism
-   Generic Material-style UI
-   Large conventional enterprise icons
-   Excessively sharp rectangular controls
-   Inconsistent card styles between modules

------------------------------------------------------------------------

# 4. Typography

Typography is a core product requirement.

## 4.1 Font characteristics

The UI should use a handwritten/hand-drawn font family throughout the
application.

Use a font with:

-   Handwritten letterforms
-   Strong readability at small sizes
-   A slightly imperfect/sketch-like appearance
-   Good support for numbers, currency and dates

Recommended implementation approach:

-   Define the font as a global design token.
-   Load it locally or from a reliable font source.
-   Provide a readable fallback stack.
-   Do not use different random handwritten fonts across pages.

## 4.2 Typography hierarchy

### Page title

Large handwritten heading.

Example:

`Payroll Dashboard`

### Page subtitle

Smaller handwritten explanatory text.

Example:

`Dashboard should help payroll/HR users understand payments, staffing impact, leave patterns...`

### Section title

Medium handwritten heading.

### Table content

Smaller handwritten text, but maintain enough contrast and spacing for
scanning.

### Status text

Use the handwritten style while retaining clear semantic color.

------------------------------------------------------------------------

# 5. Theme System

The application must support two themes.

## 5.1 Dark theme

Dark theme is the primary reference theme.

Visual direction:

-   Near-black / charcoal background
-   Slightly lighter charcoal cards
-   Warm off-white handwritten text
-   Blue active controls
-   Purple active navigation
-   Green success
-   Orange warning
-   Red error/destructive
-   Thin low-contrast borders

The background must not be pure black.

## 5.2 Light theme

The light theme must preserve the same design language.

Primary background:

-   Milky beige / warm ivory

Cards:

-   Slightly lighter or darker warm neutral

Text:

-   Dark charcoal

Borders:

-   Muted charcoal/grey

Accents:

-   Same semantic blue/purple/green/orange/red system as dark theme

The light theme should look like the same hand-drawn product on paper
rather than a completely different website.

## 5.3 Theme toggle

A global theme toggle must be available from the application shell.

Requirements:

-   Persist selected theme.
-   Respect system preference on first visit if no preference is stored.
-   Switching theme must not reload the application.
-   All pages/components must react immediately.
-   Charts, tables, popups and notifications must also update.
-   Do not hard-code theme colors inside individual components.

------------------------------------------------------------------------

# 6. Design Tokens

Create centralized design tokens for:

-   Background
-   Surface
-   Elevated surface
-   Primary text
-   Secondary text
-   Muted text
-   Border
-   Primary action
-   Active navigation
-   Success
-   Warning
-   Error
-   Info
-   Focus ring
-   Overlay
-   Chart colors
-   Border radius
-   Shadows
-   Spacing
-   Typography sizes

All modules must consume these tokens.

------------------------------------------------------------------------

# 7. Application Shell

Every authenticated page must use the same shell.

## Header/navigation

The reference navigation contains:

-   HR logo/mark
-   Employees
-   Contracts
-   Attendance
-   Time Off
-   Payroll
-   User/session controls
-   Theme control

Navigation groups:

### Employees

-   Employees
-   Contracts
-   Departments
-   Working Schedule

### Attendance

-   Attendance

### Time Off

-   Dashboard
-   Time Off Requests
-   Time Off Types
-   Allocations

### Payroll

-   Payroll Dashboard
-   Payruns
-   Payslips
-   Salary Structures
-   Salary Rules

The exact menu visibility must depend on the authenticated user's
permissions.

------------------------------------------------------------------------

# 8. Authentication & User Access

## 8.1 Login

Reference:

-   HR Portal heading
-   Welcome back
-   Work Email
-   Password
-   Forgot password
-   Sign In button

Requirements:

-   Validate required fields.
-   Display backend authentication errors.
-   Show loading state during sign-in.
-   Store authentication state according to backend authentication
    strategy.
-   Redirect authenticated users to the appropriate landing page.
-   Do not expose unauthorized modules after login.

## 8.2 User Management

Admin-only screen.

Capabilities:

-   View users
-   Search users
-   Filter by role
-   Create user
-   Edit user
-   Link user to employee
-   Assign role
-   Activate/deactivate access

Roles shown in the reference include:

-   Employee
-   HR Manager
-   HR Payroll User
-   HR Payroll Admin
-   Admin

The frontend must not treat the displayed role list as authority.
Backend permissions remain authoritative.

------------------------------------------------------------------------

# 9. Employee Module

## 9.1 Employee List

Support:

-   Kanban view
-   List view
-   Search
-   Create employee
-   Open employee record

### Kanban

Each employee card should show:

-   Avatar/initials
-   Employee name
-   Job position
-   Department
-   Active status

### List

Columns:

-   Employee
-   Work Email
-   Job Position
-   Department
-   Status

Clicking an employee must open the same employee detail route regardless
of whether the user clicked from Kanban or List.

## 9.2 Employee Detail

Reference includes:

-   Employee name
-   Avatar
-   Job position
-   Department
-   Quick buttons:
    -   Time Off
    -   Contracts
    -   Attendance
-   Work Information
-   Private Information

Work information includes:

-   Department
-   Manager
-   Working Schedule
-   Company
-   Job Position
-   Work Location
-   Status
-   Work Email

Quick-action buttons must navigate to filtered records for the current
employee.

------------------------------------------------------------------------

# 10. Contracts

## 10.1 Contract List

Columns:

-   Contract
-   Employee
-   Start
-   End
-   Wage / Month
-   Status

Support:

-   Search
-   Create
-   Open record

Running contracts must be visually obvious.

## 10.2 Contract Detail

Show:

-   Contract identifier
-   Employee
-   Department
-   Start date
-   End date
-   Status
-   Job position
-   Wage/month
-   Working schedule

Include an explanatory Salary Structure / Notes section.

Business rule:

> One employee must not have multiple running contracts for the same
> period.

The frontend should surface backend validation messages when this rule
is violated.

------------------------------------------------------------------------

# 11. Working Schedules

## 11.1 Schedule List

Support:

-   List view
-   Calendar view
-   Search
-   Filter
-   Column controls
-   Create schedule

List columns:

-   Schedule name
-   Days/week
-   Hours/week
-   Company
-   Status

## 11.2 Schedule Detail

Show:

-   Schedule name
-   Company
-   Days per week
-   Hours per week
-   Timezone
-   Weekly schedule table

Weekly schedule rows:

-   Day
-   Start time
-   End time
-   Break
-   Hours

Support adding schedule rows.

------------------------------------------------------------------------

# 12. Attendance

## 12.1 Attendance List

Filters:

-   Today
-   Employee
-   Search

Columns:

-   Employee
-   Check In
-   Check Out
-   Worked Hours
-   Status

Statuses:

-   Present
-   Absent
-   Missing / incomplete where applicable

## 12.2 Attendance Detail

Show:

-   Employee
-   Department
-   Manager
-   Check in
-   Check out
-   Status
-   Worked hours
-   Overtime
-   Notes

Worked hours and overtime must be clearly readable because they can
affect payroll.

------------------------------------------------------------------------

# 13. Attendance Quick Widget

Authenticated employees should have an attendance widget.

Widget states:

### Not checked in

Show:

-   Welcome message
-   Current time
-   Check In action
-   Current attendance status

### Checked in

Show:

-   Check-in time
-   Current duration
-   Check Out button
-   Green status indicator

### Attendance action popup

Clicking the attendance icon opens a popup.

Requirements:

-   Show current state.
-   Show today's attendance information.
-   Show Check In / Check Out action.
-   Close on outside click where appropriate.
-   Show success/error notification after action.
-   Update status without full-page reload.

------------------------------------------------------------------------

# 14. Time Off

## 14.1 Time Off Dashboard

Provide a landing page under Time Off.

It should summarize:

-   Current leave usage
-   Pending requests
-   Available allocations
-   Recent requests

## 14.2 Time Off Requests

List columns:

-   Employee
-   Type
-   Start
-   End
-   Duration
-   Status
-   Actions

Statuses:

-   To Approve
-   Approved
-   Refused
-   Cancelled
-   Other backend-supported states

Actions:

-   Open
-   Approve
-   Refuse

## 14.3 Request Detail

Show:

-   Employee
-   Time Off Type
-   Start Date
-   End Date
-   Duration
-   Status
-   Approver
-   Allocation Used
-   Reason

If allocation is required, clearly identify the allocation consumed.

## 14.4 Time Off Types

List columns:

-   Type
-   Unit
-   Allocation
-   Approval
-   Status

Example types:

-   Paid Time Off
-   Sick Leave
-   Comp Off

## 14.5 Time Off Type Detail

Show:

-   Type name
-   Approval
-   Unit
-   Requires Allocation
-   Active
-   Payroll / Work Entry behavior
-   Display color
-   Configuration notes

## 14.6 Allocations

List columns:

-   Employee
-   Type
-   Allocated
-   Taken
-   Remaining
-   Status

## 14.7 Allocation Detail

Show:

-   Employee
-   Time Off Type
-   Allocated
-   Taken
-   Remaining
-   Status
-   Approver
-   Validity
-   Description

Actions:

-   Approve
-   Refuse

Business rule:

> For leave types that require allocation, approved leave must reduce
> the employee's available balance.

------------------------------------------------------------------------

# 15. Payroll Configuration

Payroll configuration contains:

1.  Salary Structures
2.  Salary Rules

## 15.1 Salary Structures List

Columns:

-   Structure Name
-   Rules
-   Employees
-   Active

Reference examples:

-   Regular Salary
-   Intern Salary
-   Contractor

## 15.2 Salary Structure Detail

Show:

-   Structure name
-   Active
-   Ordered salary rules

Columns:

-   Rule Name
-   Code
-   Category
-   Sequence

Sequence must be visible because salary rule order affects calculation.

------------------------------------------------------------------------

# 16. Salary Rules

## 16.1 Salary Rule List

Columns:

-   Rule Name
-   Code
-   Category
-   Structure
-   Sequence

## 16.2 Salary Rule Detail

Fields:

-   Rule Name
-   Code
-   Category
-   Sequence
-   Salary Structure
-   Computation Type
-   Percentage
-   Quantity

Computation modes from the reference:

### Fixed Amount

Uses an exact amount.

Example:

`Meal Allowance = ₹2,000`

### Percentage of Wage

Calculates the rule from a selected salary base.

Example:

`HRA = 20% of Basic Salary`

### Python Code / Formula

Used for advanced calculations involving multiple payroll values or
conditions.

The UI must render the appropriate fields depending on the selected
computation mode.

------------------------------------------------------------------------

# 17. Payruns

## 17.1 Payrun List

Payruns represent payroll periods.

Each payrun card/row should show:

-   Period/month
-   Date range
-   Employee count
-   Status
-   Warning count

Statuses:

-   Draft
-   Validated
-   Paid
-   Other backend-supported statuses

## 17.2 Create Payrun Flow

Important rule:

> A Payrun is created only after the user selects eligible employee
> records.

Flow:

1.  User clicks New.
2.  User enters/selects payroll period.
3.  User selects salary structure if required.
4.  User continues to employee selection.
5.  Employee selection modal opens.
6.  User searches employees.
7.  User selects one or more eligible employees.
8.  User clicks Create Payrun.
9.  Backend creates the payrun containing only selected employees.
10. Frontend navigates to the created payrun.

Do NOT create the Payrun merely because the user opens the employee
selection screen or clicks Continue.

## 17.3 Employee Selection Modal

Show:

-   Search employees
-   Select all
-   Individual checkboxes
-   Employee
-   Working hours
-   Start date
-   Wage
-   Selected count
-   Create Payrun
-   Back

The modal must support keyboard navigation and clear selection feedback.

------------------------------------------------------------------------

# 18. Payrun Detail

Reference actions:

-   Compute
-   Validate
-   Mark Paid
-   Send Payslips

Show:

-   Name
-   Salary Structure
-   Period
-   Status

Payrun employee table:

-   Employee
-   Warning
-   Worked days
-   Basic
-   Gross
-   Net
-   Status
-   Payslip

Important behavior:

-   Missing bank account should produce a warning.
-   Duplicate payslip should produce a warning.
-   Missing/invalid attendance should produce a warning.
-   Payroll cannot be finalized if backend validation rejects it.
-   Warnings should be visually distinct from blocking errors.

------------------------------------------------------------------------

# 19. Payslips

## 19.1 Payslip List

Filters:

-   Search
-   Period

Columns:

-   Employee
-   Warning
-   Period
-   Basic
-   Gross
-   Net
-   Structure
-   Status

Selecting a payslip opens its detail page.

## 19.2 Payslip Detail

Show:

-   Employee
-   Period
-   Salary Structure
-   Status
-   Worked Days

Salary computation table:

-   Rule
-   Category
-   Amount
-   Code

Show final:

-   Gross
-   Deductions
-   Net salary

Actions:

-   Compute
-   Mark Paid
-   Print Payslip

------------------------------------------------------------------------

# 20. Payroll Dashboard

The dashboard is the primary analytical payroll screen.

## Filters

-   Period
-   Department
-   Employee Type
-   Company

## KPI cards

At minimum:

-   Total Net Salary Paid
-   Payslips Generated
-   Avg Salary / Employee
-   Approved Time Off Days
-   Attendance Health

Each KPI may include comparison/helper text where data exists.

## Charts

### Salary Cost by Department

Bar chart.

### Monthly Net Salary Trend

Line chart.

### Payslip Status & Payroll Alerts

Show:

-   Paid
-   Done
-   Pending
-   Warning

Also show current alerts, such as:

-   Employees missing bank account
-   Duplicate payslips
-   Unvalidated attendance
-   Expiring contracts

### Attendance Overview

Summarize:

-   Present
-   Late
-   Absent
-   Overtime

### Time Off Overview

Table:

-   Type
-   Approved Days
-   Pending
-   Remaining Balance

### Department Summary

Columns:

-   Department
-   Employees
-   Payslips
-   Monthly Salary

## Aggregation requirements

The dashboard must not calculate independently from stale frontend data
if the backend already provides aggregate/reporting endpoints.

Preferred data flow:

`Backend aggregation/reporting endpoint -> dashboard service -> typed view model -> chart/card`

If aggregation endpoints do not exist, the frontend may aggregate only
data that is explicitly safe and complete according to the backend
contract.

------------------------------------------------------------------------

# 21. Notifications

Notifications must follow the handwritten visual style.

Types:

-   Success
-   Info
-   Warning
-   Error

Examples:

-   `Payroll validated successfully`
-   `Payrun created for 22 employees`
-   `3 employees are missing bank details`
-   `Unable to approve allocation`

Requirements:

-   Non-blocking toast for normal feedback.
-   Modal/dialog for destructive or high-impact confirmation.
-   Notifications must support theme switching.
-   Do not use browser-native alert dialogs for normal application
    actions.

------------------------------------------------------------------------

# 22. Popups & Dialogs

All dialogs must share one component system.

Use dialogs for:

-   Attendance check-in/check-out
-   Employee selection
-   Create/edit forms when appropriate
-   Delete/destructive confirmations
-   Approval/refusal confirmation
-   Important payroll validation errors

Dialog requirements:

-   Centered on desktop
-   Responsive on smaller screens
-   Backdrop
-   Keyboard escape support
-   Focus management
-   Handwritten title
-   Handwritten buttons and helper text
-   Clear primary/secondary actions

------------------------------------------------------------------------

# 23. Icons & Diagrams

Icons must follow the hand-drawn/sketch style.

Avoid visually mixing:

-   Filled corporate icon sets
-   Highly polished 3D icons
-   Unrelated icon families

Use a consistent icon library or custom SVG treatment with a sketch-like
appearance.

Icons should communicate:

-   Navigation
-   Search
-   Filter
-   Edit
-   Delete
-   Add
-   Calendar
-   Clock
-   Employee
-   Payroll
-   Attendance
-   Time Off
-   Approval
-   Warning
-   Success
-   Theme

Diagrams/arrows used for product flow documentation are not required
inside normal product pages unless they convey an actual workflow.

------------------------------------------------------------------------

# 24. Tables

All data tables must use a common table component.

Required features:

-   Loading skeleton
-   Empty state
-   Error state
-   Search/filter integration
-   Sort where supported
-   Pagination where supported
-   Row hover state
-   Clickable rows where appropriate
-   Responsive overflow
-   Status badges
-   Action column
-   Accessible keyboard navigation

Never create separate visual table implementations for each module
unless the data structure genuinely requires it.

------------------------------------------------------------------------

# 25. Forms

All forms should use reusable field components.

Supported field patterns:

-   Text
-   Email
-   Password
-   Number
-   Currency
-   Date
-   Date range
-   Time
-   Select
-   Multi-select
-   Checkbox
-   Radio
-   Toggle
-   Searchable select

Requirements:

-   Required-field indication
-   Inline validation
-   Backend validation error mapping
-   Disabled/loading submit state
-   Unsaved-change handling where applicable

------------------------------------------------------------------------

# 26. API Integration Architecture

This is a mandatory requirement.

> **Every frontend API integration must remain compatible with the
> existing backend.**

The frontend must not invent a separate data model that conflicts with
the backend.

## 26.1 API source of truth

Before implementing each feature:

1.  Inspect the existing backend endpoint.
2.  Identify:
    -   HTTP method
    -   Route
    -   Request body
    -   Query parameters
    -   Path parameters
    -   Response shape
    -   Error shape
    -   Authentication requirements
    -   Authorization requirements
3.  Create a typed frontend contract for that endpoint.
4.  Implement the UI against the typed contract.

## 26.2 API client

Create a centralized API client in the frontend.

Responsibilities:

-   Base URL configuration
-   Authentication handling
-   Request serialization
-   Response parsing
-   Error normalization
-   Request cancellation where useful
-   Common headers
-   Timeout handling where appropriate

Components/pages must not directly duplicate raw request configuration.

## 26.3 Feature services

Organize API access by domain.

Suggested structure:

``` text
src/
  api/
    client/
    auth/
    employees/
    contracts/
    schedules/
    attendance/
    time-off/
    payroll/
    salary-structures/
    salary-rules/
    payruns/
    payslips/
    dashboard/
```

The exact directory names may be adapted to the existing frontend
architecture.

## 26.4 No fake production endpoints

Do not create arbitrary endpoint names merely because they are
convenient for the frontend.

If the backend exposes:

`POST /api/payroll/payruns`

the frontend must consume that endpoint rather than inventing:

`POST /api/create-payrun`

unless the backend actually provides it.

## 26.5 Endpoint coverage

The implementation is complete only when every backend capability
required by the UI has a corresponding frontend integration.

Maintain an endpoint matrix:

  ----------------------------------------------------------------------------------
  Feature          Endpoint          Method            Frontend       Status
                                                       Screen         
  ---------------- ----------------- ----------------- -------------- --------------
  Authentication   Backend-defined   Backend-defined   Login          Pending

  Employees        Backend-defined   Backend-defined   Employee List  Pending

  Employee Detail  Backend-defined   Backend-defined   Employee       Pending
                                                       Detail         

  Contracts        Backend-defined   Backend-defined   Contracts      Pending

  Schedules        Backend-defined   Backend-defined   Working        Pending
                                                       Schedules      

  Attendance       Backend-defined   Backend-defined   Attendance     Pending

  Time Off         Backend-defined   Backend-defined   Requests       Pending
  Requests                                                            

  Time Off Types   Backend-defined   Backend-defined   Types          Pending

  Allocations      Backend-defined   Backend-defined   Allocations    Pending

  Salary           Backend-defined   Backend-defined   Structures     Pending
  Structures                                                          

  Salary Rules     Backend-defined   Backend-defined   Rules          Pending

  Payruns          Backend-defined   Backend-defined   Payruns        Pending

  Payslips         Backend-defined   Backend-defined   Payslips       Pending

  Payroll          Backend-defined   Backend-defined   Dashboard      Pending
  Dashboard                                                           
  ----------------------------------------------------------------------------------

The final implementation should replace all `Backend-defined`
placeholders with the actual backend contract.

------------------------------------------------------------------------

# 27. Data Fetching & State Management

Use a consistent server-state strategy.

Requirements:

-   Cache GET requests where appropriate.
-   Invalidate affected data after mutations.
-   Refetch or update affected records after successful mutations.
-   Show optimistic UI only where rollback is safe.
-   Avoid unnecessary full-page reloads.
-   Preserve filters when navigating back.
-   Handle stale data explicitly.

Examples:

After approving a Time Off request:

`Approve -> backend mutation -> invalidate request list + allocation -> refresh UI`

After Check In:

`Check In -> backend mutation -> update widget -> update attendance data`

After Compute Payrun:

`Compute -> backend mutation -> refresh payrun + payslips`

------------------------------------------------------------------------

# 28. Routing

Use a clear route hierarchy.

Suggested route model:

``` text
/login

/employees
/employees/:employeeId

/contracts
/contracts/:contractId

/working-schedules
/working-schedules/:scheduleId

/attendance
/attendance/:attendanceId

/time-off
/time-off/requests
/time-off/requests/:requestId
/time-off/types
/time-off/types/:typeId
/time-off/allocations
/time-off/allocations/:allocationId

/payroll
/payroll/dashboard
/payroll/payruns
/payroll/payruns/:payrunId
/payroll/payslips
/payroll/payslips/:payslipId
/payroll/salary-structures
/payroll/salary-structures/:structureId
/payroll/salary-rules
/payroll/salary-rules/:ruleId

/admin/users
```

Actual route naming may be adjusted to match the existing project
conventions.

------------------------------------------------------------------------

# 29. Cross-Module Navigation

Relationships are important.

Examples:

### Employee -\> Contracts

Employee Detail -\> Contracts button -\> Contracts filtered by employee.

### Employee -\> Attendance

Employee Detail -\> Attendance button -\> Attendance filtered by
employee.

### Employee -\> Time Off

Employee Detail -\> Time Off button -\> Requests filtered by employee.

### Employee -\> Payroll

Employee -\> related payslips/payruns where permitted.

### Contract -\> Payroll

Running contract is the source of wage/salary context for payroll.

### Attendance -\> Payroll

Worked days/overtime can influence payroll.

### Time Off -\> Payroll

Approved leave can influence work entries/payroll calculations.

### Salary Structure -\> Payrun

Selected salary structure determines payroll computation.

### Payrun -\> Payslips

Payrun contains/generated payslips.

------------------------------------------------------------------------

# 30. Authorization

Frontend visibility should reflect backend permissions.

Examples:

-   Employee users should not see admin-only user management.
-   Payroll users should see payroll pages permitted by their role.
-   HR users should see HR modules permitted by their role.
-   Admin-only operations should not be enabled merely because a button
    is present in the UI.

Important:

> Hiding a button is not security. Backend authorization is the security
> boundary.

Frontend should gracefully handle `401` and `403`.

------------------------------------------------------------------------

# 31. Loading, Empty & Error States

Every API-driven page must define:

## Loading

Use handwritten skeletons/spinners consistent with the theme.

## Empty

Example:

`No payslips found for this period.`

Include an appropriate action when possible.

## Error

Example:

`We couldn't load attendance records.`

Provide:

-   Retry
-   Useful error context
-   No raw backend stack traces

## Mutation error

Keep the current form/table state intact where possible and show the
backend error in a user-readable way.

------------------------------------------------------------------------

# 32. Responsive Requirements

Primary target:

-   Desktop/laptop

Also support:

-   Tablet
-   Narrow desktop windows

On smaller widths:

-   Tables may horizontally scroll.
-   Cards may stack.
-   Dashboard charts may become single-column.
-   Navigation may collapse into a compact menu.
-   Dialogs should fit the viewport.
-   No critical data should be clipped.

Do not redesign the application into a generic mobile app; preserve the
same visual identity.

------------------------------------------------------------------------

# 33. Accessibility

Even with the handwritten aesthetic, the application must remain usable.

Requirements:

-   Keyboard navigation
-   Visible focus states
-   Semantic buttons/links
-   Form labels
-   Accessible dialog behavior
-   Sufficient contrast
-   Tooltips for unfamiliar icons
-   Screen-reader-friendly status messaging
-   Do not communicate status by color alone

------------------------------------------------------------------------

# 34. Performance

Requirements:

-   Lazy-load large modules where useful.
-   Avoid unnecessary API requests.
-   Debounce search inputs where appropriate.
-   Paginate large datasets.
-   Avoid rendering thousands of rows at once.
-   Keep dashboard charts responsive.
-   Do not block initial application rendering while unrelated modules
    load.

------------------------------------------------------------------------

# 35. Error & Validation Rules

Frontend validation should improve UX but must never replace backend
validation.

Examples:

### Payrun

-   Employee selection required.
-   Invalid employee cannot be selected.
-   Backend eligibility remains authoritative.

### Contract

-   Invalid dates should be blocked client-side where obvious.
-   Multiple running contracts must be rejected according to backend
    validation.

### Time Off

-   End date cannot precede start date.
-   Allocation requirements must be shown.
-   Final approval must use backend validation.

### Salary Rule

-   Percentage values must be valid numeric ranges according to backend
    rules.
-   Required computation fields depend on computation type.

------------------------------------------------------------------------

# 36. Component Architecture

Build reusable primitives first.

Suggested UI primitives:

``` text
AppShell
TopNav
Sidebar/Menu
PageHeader
Card
KpiCard
Button
IconButton
Input
Select
DatePicker
DateRangePicker
SearchInput
FilterBar
Tabs
Table
StatusBadge
Modal
Drawer
Toast
ConfirmDialog
EmptyState
ErrorState
LoadingState
Avatar
Tooltip
ThemeToggle
ChartCard
```

Domain components:

``` text
EmployeeCard
EmployeeTable
ContractTable
AttendanceTable
TimeOffRequestTable
AllocationTable
SalaryRuleTable
SalaryStructureTable
PayrunTable
PayslipTable
PayrollKpi
PayrollAlertList
AttendanceWidget
EmployeeSelector
SalaryComputationTable
```

------------------------------------------------------------------------

# 37. Suggested Frontend Project Structure

Because the repository is already a Bun/Turborepo project and
`apps/frontend/` exists, preserve the monorepo structure.

Suggested organization:

``` text
apps/
  backend/
  frontend/
    src/
      app/
      routes/
      components/
      features/
        auth/
        employees/
        contracts/
        schedules/
        attendance/
        time-off/
        payroll/
        salary-structures/
        salary-rules/
        payruns/
        payslips/
        dashboard/
      api/
      hooks/
      lib/
      stores/
      styles/
      types/
      assets/
```

Use the project's existing configuration when it already establishes
conventions.

------------------------------------------------------------------------

# 38. Backend Compatibility Workflow

For every frontend module:

### Step 1 --- Inspect backend

Find existing routes/controllers/services/schema.

### Step 2 --- Document contract

Record request/response/error shapes.

### Step 3 --- Type the contract

Create TypeScript types/interfaces matching the backend.

### Step 4 --- Implement API service

Keep network code outside presentation components.

### Step 5 --- Implement state/query layer

Handle caching, loading and mutation invalidation.

### Step 6 --- Build UI

Bind the UI to real data.

### Step 7 --- Verify mutations

Confirm that the backend state actually changes.

### Step 8 --- Verify navigation

Confirm that IDs, filters and related records are correctly passed
between pages.

------------------------------------------------------------------------

# 39. Mock Data Policy

Mock data may be used temporarily during isolated UI development.

However:

-   Do not leave mock data as the production data source.
-   Keep mock data behind a development-only boundary.
-   Production pages must consume backend APIs.
-   Do not make UI logic depend on fields that do not exist in backend
    responses.
-   If a required field is missing from the backend, document the gap
    rather than silently inventing it.

------------------------------------------------------------------------

# 40. Security Requirements

-   Never store passwords in frontend state longer than necessary.
-   Do not expose secrets in frontend environment variables.
-   Only public client configuration may be shipped to the browser.
-   Handle token/session expiry.
-   Clear sensitive client state on logout.
-   Respect backend authorization.
-   Do not log credentials or sensitive payroll information.

------------------------------------------------------------------------

# 41. Acceptance Criteria

The frontend will be considered complete when:

### Visual

-   [ ] Every reference screen has a corresponding implemented screen.
-   [ ] Global handwritten typography is consistent.
-   [ ] Dark theme visually matches the supplied references.
-   [ ] Light theme uses the requested milky-beige aesthetic.
-   [ ] Borders, cards, buttons, badges and tables use one consistent
    visual system.
-   [ ] Icons and diagrams follow the sketch/hand-drawn style.
-   [ ] Notifications and popups also use the handwritten theme.
-   [ ] Theme switching works across every page.

### Functional

-   [ ] Login works with the backend.
-   [ ] Role-based access works.
-   [ ] Employees can be listed, searched and opened.
-   [ ] Employee related-record buttons navigate correctly.
-   [ ] Contracts work end-to-end.
-   [ ] Working schedules work end-to-end.
-   [ ] Attendance list/detail works.
-   [ ] Attendance Check In/Check Out works.
-   [ ] Time Off Requests work.
-   [ ] Time Off Types work.
-   [ ] Allocations work.
-   [ ] Salary Structures work.
-   [ ] Salary Rules work.
-   [ ] Payrun creation requires employee selection.
-   [ ] Payrun creation contains only selected employees.
-   [ ] Payrun compute/validate/paid actions work.
-   [ ] Payslips work.
-   [ ] Payroll dashboard displays backend-derived data.
-   [ ] Notifications display after relevant mutations.

### API

-   [ ] No production screen depends on hardcoded mock records.
-   [ ] Every required backend endpoint has a frontend integration.
-   [ ] HTTP methods match backend definitions.
-   [ ] Request payloads match backend schemas.
-   [ ] Response handling matches backend schemas.
-   [ ] Backend validation errors are displayed correctly.
-   [ ] 401/403 responses are handled.
-   [ ] API base URL is configurable by environment.
-   [ ] API logic is centralized and reusable.

### Quality

-   [ ] No broken navigation.
-   [ ] No dead buttons.
-   [ ] No console errors during normal use.
-   [ ] Loading states exist.
-   [ ] Empty states exist.
-   [ ] Error states exist.
-   [ ] Forms provide validation feedback.
-   [ ] Tables handle large datasets appropriately.
-   [ ] UI remains usable at narrower desktop widths.
-   [ ] Keyboard interaction works for important controls.

------------------------------------------------------------------------

# 42. Definition of Done

A page is not considered complete merely because it visually matches the
screenshot.

A page is **Done** only when:

1.  UI matches the reference direction.
2.  Route exists.
3.  Backend API integration exists.
4.  Real backend data renders.
5.  Loading state exists.
6.  Empty state exists.
7.  Error state exists.
8.  Mutations work where applicable.
9.  Backend validation errors are surfaced.
10. Related-record navigation works.
11. Theme switching works.
12. Role permissions are respected.
13. No mock production dependency remains.

------------------------------------------------------------------------

# 43. Implementation Priority

Recommended build order:

## Phase 1 --- Foundation

1.  Frontend application shell
2.  Routing
3.  Theme system
4.  Typography
5.  Design tokens
6.  API client
7.  Authentication
8.  Reusable UI primitives

## Phase 2 --- Core HR

9.  Employees
10. Employee detail
11. Contracts
12. Working schedules

## Phase 3 --- Attendance & Time Off

13. Attendance
14. Attendance widget
15. Time Off dashboard
16. Time Off requests
17. Time Off types
18. Allocations

## Phase 4 --- Payroll Configuration

19. Salary structures
20. Salary rules

## Phase 5 --- Payroll Operations

21. Payrun list
22. Payrun creation
23. Employee selection
24. Payrun detail
25. Payslips
26. Payslip detail

## Phase 6 --- Analytics & Polish

27. Payroll dashboard
28. Notifications
29. Empty/error/loading states
30. Responsive refinement
31. Accessibility pass
32. API contract verification
33. End-to-end flow testing

------------------------------------------------------------------------

# 44. Primary End-to-End User Flows

## Flow A --- Login -\> Employee

`Login -> Employees -> Employee List -> Employee Detail`

## Flow B --- Employee -\> Contract

`Employee Detail -> Contracts -> Contract Detail`

## Flow C --- Employee -\> Attendance

`Employee Detail -> Attendance -> Attendance Detail`

## Flow D --- Employee -\> Time Off

`Employee Detail -> Time Off -> Request -> Request Detail`

## Flow E --- Time Off Allocation

`Time Off -> Allocations -> Allocation Detail -> Approve/Refuse`

## Flow F --- Payroll Configuration

`Payroll -> Salary Structures -> Structure Detail -> Salary Rules -> Rule Detail`

## Flow G --- Create Payrun

`Payroll -> Payruns -> New -> Configure Period/Structure -> Select Employees -> Create Payrun -> Payrun Detail`

## Flow H --- Payroll Processing

`Payrun Detail -> Compute -> Validate -> Mark Paid -> Send Payslips`

## Flow I --- Payslip

`Payruns -> Payslip -> Payslip Detail -> Print`

## Flow J --- Attendance Quick Action

`Employee Dashboard/Widget -> Attendance Icon -> Check In/Check Out Popup -> Backend Mutation -> Notification -> Updated Widget`

------------------------------------------------------------------------

# 45. Final Product Principle

PeoplePay360 should feel like a **hand-drawn HR operating system**, not
a generic enterprise admin template.

The implementation must preserve three things simultaneously:

**1. Visual fidelity**\
The supplied screenshots define the aesthetic language.

**2. Functional integrity**\
Every important interaction must work through real backend APIs.

**3. Consistency**\
Employees, Attendance, Time Off and Payroll must feel like modules of
the same product, using the same shell, typography, controls,
notifications, dialogs, tables, status system and theme.

The frontend should therefore be implemented as a reusable design
system + domain feature modules + typed backend integration, rather than
as independent screenshot replicas.
