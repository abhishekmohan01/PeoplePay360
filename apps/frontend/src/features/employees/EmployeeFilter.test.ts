import { describe, it, expect } from 'bun:test';
import { filterEmployees } from './filterEmployees';
import type { Employee } from '../../api/employees';

const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'EMP-001',
    firstName: 'Dwight',
    lastName: 'Schrute',
    name: 'Dwight Schrute',
    workEmail: 'dwight@peoplepay360.com',
    email: 'dwight@peoplepay360.com',
    jobPosition: 'Assistant to the Regional Manager',
    departmentName: 'Sales & Marketing',
    status: 'ACTIVE',
    workLocation: 'Headquarters',
  },
  {
    id: 'emp-2',
    employeeCode: 'EMP-002',
    firstName: 'Jim',
    lastName: 'Halpert',
    name: 'Jim Halpert',
    workEmail: 'jim@peoplepay360.com',
    email: 'jim@peoplepay360.com',
    jobPosition: 'Sales Specialist',
    departmentName: 'Sales & Marketing',
    status: 'ACTIVE',
    workLocation: 'Headquarters',
  },
  {
    id: 'emp-3',
    employeeCode: 'EMP-007',
    firstName: 'Michael',
    lastName: 'Scott',
    name: 'Michael Scott',
    workEmail: 'michael@peoplepay360.com',
    email: 'michael@peoplepay360.com',
    jobPosition: 'Regional Sales Manager',
    departmentName: 'Sales & Marketing',
    status: 'ACTIVE',
    workLocation: 'Headquarters',
  },
  {
    id: 'emp-4',
    employeeCode: 'EMP-004',
    firstName: 'Stanley',
    lastName: 'Hudson',
    name: 'Stanley Hudson',
    workEmail: 'stanley@peoplepay360.com',
    email: 'stanley@peoplepay360.com',
    jobPosition: 'Senior Accountant',
    departmentName: 'Finance',
    status: 'INACTIVE',
    workLocation: 'Annex',
  },
  {
    id: 'emp-5',
    employeeCode: 'EMP-005',
    firstName: 'Ryan',
    lastName: 'Howard',
    name: 'Ryan Howard',
    workEmail: 'ryan@peoplepay360.com',
    email: 'ryan@peoplepay360.com',
    jobPosition: 'Temp Worker',
    departmentName: 'Operations',
    status: 'TERMINATED',
    workLocation: 'Headquarters',
  },
];

describe('filterEmployees - All Cases', () => {
  describe('1. Status Filter Cases', () => {
    it('returns all employees when statusFilter is "ALL"', () => {
      const result = filterEmployees(mockEmployees, { statusFilter: 'ALL' });
      expect(result.length).toBe(5);
    });

    it('matches ACTIVE employees when statusFilter is "ACTIVE"', () => {
      const result = filterEmployees(mockEmployees, { statusFilter: 'ACTIVE' });
      expect(result.length).toBe(3);
      expect(result.map(e => e.name)).toEqual(['Dwight Schrute', 'Jim Halpert', 'Michael Scott']);
    });

    it('matches ACTIVE employees when statusFilter is "Active" (TitleCase UI value)', () => {
      const result = filterEmployees(mockEmployees, { statusFilter: 'Active' });
      expect(result.length).toBe(3);
      expect(result.map(e => e.name)).toContain('Michael Scott');
    });

    it('matches ACTIVE employees when statusFilter is "active" (lowercase)', () => {
      const result = filterEmployees(mockEmployees, { statusFilter: 'active' });
      expect(result.length).toBe(3);
    });

    it('matches INACTIVE employees with "INACTIVE" or "Inactive"', () => {
      const resultUpper = filterEmployees(mockEmployees, { statusFilter: 'INACTIVE' });
      expect(resultUpper.length).toBe(1);
      expect(resultUpper[0]!.name).toBe('Stanley Hudson');

      const resultTitle = filterEmployees(mockEmployees, { statusFilter: 'Inactive' });
      expect(resultTitle.length).toBe(1);
      expect(resultTitle[0]!.name).toBe('Stanley Hudson');
    });

    it('matches TERMINATED employees with "TERMINATED" or "Terminated"', () => {
      const result = filterEmployees(mockEmployees, { statusFilter: 'Terminated' });
      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('Ryan Howard');
    });

    it('handles status with extra whitespace', () => {
      const result = filterEmployees(mockEmployees, { statusFilter: '  Active  ' });
      expect(result.length).toBe(3);
    });
  });

  describe('2. Department Filter Cases', () => {
    it('returns all departments when deptFilter is "ALL"', () => {
      const result = filterEmployees(mockEmployees, { deptFilter: 'ALL' });
      expect(result.length).toBe(5);
    });

    it('matches department exactly', () => {
      const result = filterEmployees(mockEmployees, { deptFilter: 'Finance' });
      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('Stanley Hudson');
    });

    it('matches department case-insensitively and with trimmed whitespace', () => {
      const result = filterEmployees(mockEmployees, { deptFilter: '  sales & marketing  ' });
      expect(result.length).toBe(3);
    });

    it('supports nested department.name object', () => {
      const nestedDeptEmployees: Employee[] = [
        {
          ...mockEmployees[0]!,
          departmentName: undefined,
          department: { id: 'd1', name: 'Engineering', code: 'ENG' },
        },
      ];
      const result = filterEmployees(nestedDeptEmployees, { deptFilter: 'Engineering' });
      expect(result.length).toBe(1);
    });
  });

  describe('3. Combined Filter Cases (The User Reproduction Scenario)', () => {
    it('Sales & Marketing + All Statuses returns all 3 sales employees including Michael Scott', () => {
      const result = filterEmployees(mockEmployees, {
        deptFilter: 'Sales & Marketing',
        statusFilter: 'ALL',
      });
      expect(result.length).toBe(3);
      expect(result.map(e => e.name)).toContain('Michael Scott');
    });

    it('Sales & Marketing + Active returns active sales employees including Michael Scott', () => {
      const result = filterEmployees(mockEmployees, {
        deptFilter: 'Sales & Marketing',
        statusFilter: 'Active',
      });
      expect(result.length).toBe(3);
      expect(result.map(e => e.name)).toContain('Michael Scott');
    });

    it('Sales & Marketing + Inactive returns 0 employees because none are inactive', () => {
      const result = filterEmployees(mockEmployees, {
        deptFilter: 'Sales & Marketing',
        statusFilter: 'Inactive',
      });
      expect(result.length).toBe(0);
    });

    it('Finance + Inactive returns Stanley Hudson', () => {
      const result = filterEmployees(mockEmployees, {
        deptFilter: 'Finance',
        statusFilter: 'Inactive',
      });
      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('Stanley Hudson');
    });
  });

  describe('4. Search Query Cases', () => {
    it('searches by name case-insensitively', () => {
      const result = filterEmployees(mockEmployees, { search: 'michael' });
      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('Michael Scott');
    });

    it('searches by employee code', () => {
      const result = filterEmployees(mockEmployees, { search: 'emp-007' });
      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('Michael Scott');
    });

    it('searches by job title', () => {
      const result = filterEmployees(mockEmployees, { search: 'Regional Sales Manager' });
      expect(result.map(e => e.name)).toContain('Michael Scott');
    });

    it('searches by email address', () => {
      const result = filterEmployees(mockEmployees, { search: 'michael@peoplepay360.com' });
      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('Michael Scott');
    });

    it('searches across multiple tokens', () => {
      const result = filterEmployees(mockEmployees, { search: 'michael manager' });
      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('Michael Scott');
    });

    it('handles search with leading and trailing spaces', () => {
      const result = filterEmployees(mockEmployees, { search: '   scott   ' });
      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('Michael Scott');
    });
  });

  describe('5. Edge and Resiliency Cases', () => {
    it('handles empty employees list gracefully', () => {
      expect(filterEmployees([], { statusFilter: 'ACTIVE' })).toEqual([]);
    });

    it('handles null and undefined employees gracefully', () => {
      expect(filterEmployees(null, { statusFilter: 'ACTIVE' })).toEqual([]);
      expect(filterEmployees(undefined, { statusFilter: 'ACTIVE' })).toEqual([]);
    });

    it('handles employees with missing or undefined fields', () => {
      const corruptedEmployees: any[] = [
        { id: 'c-1' },
        { id: 'c-2', name: 'Valid Name', status: 'ACTIVE' },
      ];
      const result = filterEmployees(corruptedEmployees, {
        search: 'Valid',
        statusFilter: 'ACTIVE',
      });
      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('Valid Name');
    });
  });

});
