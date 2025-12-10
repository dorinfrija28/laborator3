/**
 * Employee Service - Implements CRUD business logic
 * Uses in-memory storage (safe for Node.js single-threaded event loop)
 * In a production system, this would interact with a database
 */

import { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from '../models/employee';

class EmployeeService {
    private employees: Employee[] = [];
    private nextId: number = 1;

    constructor() {
        // Start with empty data - all data comes from actual CRUD operations
        // No mock/seed data - ensures all data is real and user-created
    }

    /**
     * Get all employees with pagination support
     */
    getAll(offset: number = 0, limit: number = 100): Employee[] {
        const start = Math.max(0, offset);
        const end = start + limit;
        return this.employees.slice(start, end);
    }

    /**
     * Get a single employee by ID
     */
    getById(id: number): Employee | undefined {
        return this.employees.find((emp) => emp.id === id);
    }

    /**
     * Create a new employee
     */
    create(dto: CreateEmployeeDTO): Employee {
        const now = new Date();
        const employee: Employee = {
            id: this.nextId++,
            ...dto,
            createdAt: now,
            updatedAt: now,
        };
        this.employees.push(employee);
        return employee;
    }

    /**
     * Update an existing employee
     */
    update(id: number, dto: UpdateEmployeeDTO): Employee | null {
        const index = this.employees.findIndex((emp) => emp.id === id);
        if (index === -1) {
            return null;
        }

        const existing = this.employees[index];
        const updated: Employee = {
            ...existing,
            ...dto,
            updatedAt: new Date(),
        };
        this.employees[index] = updated;
        return updated;
    }

    /**
     * Delete an employee
     */
    delete(id: number): boolean {
        const index = this.employees.findIndex((emp) => emp.id === id);
        if (index === -1) {
            return false;
        }
        this.employees.splice(index, 1);
        return true;
    }

    /**
     * Get total count of employees
     */
    getCount(): number {
        return this.employees.length;
    }
}

// Export singleton instance
export const employeeService = new EmployeeService();

