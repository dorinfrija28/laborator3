/**
 * Employee Service - Implements CRUD business logic
 * Uses PostgreSQL database for shared storage across all DW servers
 * All DW servers connect to the same database, ensuring data synchronization
 */

import { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from '../models/employee';
import { query } from '../database/db';
import { logger } from '../../shared/logger';

class EmployeeService {
    constructor() {
        // Database connection is initialized in dwServer.ts
        // All DW servers share the same database, so data is synchronized
    }

    /**
     * Get all employees with pagination support
     */
    async getAll(offset: number = 0, limit: number = 100): Promise<Employee[]> {
        try {
            const result = await query(
                `SELECT id, first_name, last_name, position, salary, created_at, updated_at 
                 FROM employees 
                 ORDER BY id ASC 
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );

            return result.rows.map(this.mapRowToEmployee);
        } catch (error) {
            logger.error('Failed to get all employees', { error: (error as Error).message });
            throw error;
        }
    }

    /**
     * Get a single employee by ID
     */
    async getById(id: number): Promise<Employee | null> {
        try {
            const result = await query(
                `SELECT id, first_name, last_name, position, salary, created_at, updated_at 
                 FROM employees 
                 WHERE id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToEmployee(result.rows[0]);
        } catch (error) {
            logger.error('Failed to get employee by ID', { id, error: (error as Error).message });
            throw error;
        }
    }

    /**
     * Create a new employee
     */
    async create(dto: CreateEmployeeDTO): Promise<Employee> {
        try {
            const result = await query(
                `INSERT INTO employees (first_name, last_name, position, salary, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id, first_name, last_name, position, salary, created_at, updated_at`,
                [dto.firstName, dto.lastName, dto.position, dto.salary]
            );

            const employee = this.mapRowToEmployee(result.rows[0]);
            logger.info('Employee created', { id: employee.id, name: `${employee.firstName} ${employee.lastName}` });
            return employee;
        } catch (error) {
            logger.error('Failed to create employee', { error: (error as Error).message });
            throw error;
        }
    }

    /**
     * Update an existing employee
     */
    async update(id: number, dto: UpdateEmployeeDTO): Promise<Employee | null> {
        try {
            // Build dynamic UPDATE query based on provided fields
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (dto.firstName !== undefined) {
                updates.push(`first_name = $${paramIndex++}`);
                values.push(dto.firstName);
            }
            if (dto.lastName !== undefined) {
                updates.push(`last_name = $${paramIndex++}`);
                values.push(dto.lastName);
            }
            if (dto.position !== undefined) {
                updates.push(`position = $${paramIndex++}`);
                values.push(dto.position);
            }
            if (dto.salary !== undefined) {
                updates.push(`salary = $${paramIndex++}`);
                values.push(dto.salary);
            }

            if (updates.length === 0) {
                // No fields to update, just return existing employee
                return await this.getById(id);
            }

            // Always update updated_at timestamp
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);

            const result = await query(
                `UPDATE employees 
                 SET ${updates.join(', ')}
                 WHERE id = $${paramIndex}
                 RETURNING id, first_name, last_name, position, salary, created_at, updated_at`,
                values
            );

            if (result.rows.length === 0) {
                return null;
            }

            const employee = this.mapRowToEmployee(result.rows[0]);
            logger.info('Employee updated', { id: employee.id });
            return employee;
        } catch (error) {
            logger.error('Failed to update employee', { id, error: (error as Error).message });
            throw error;
        }
    }

    /**
     * Delete an employee
     */
    async delete(id: number): Promise<boolean> {
        try {
            const result = await query(
                `DELETE FROM employees WHERE id = $1`,
                [id]
            );

            const deleted = result.rowCount !== null && result.rowCount > 0;
            if (deleted) {
                logger.info('Employee deleted', { id });
            }
            return deleted;
        } catch (error) {
            logger.error('Failed to delete employee', { id, error: (error as Error).message });
            throw error;
        }
    }

    /**
     * Get total count of employees
     */
    async getCount(): Promise<number> {
        try {
            const result = await query(`SELECT COUNT(*) as count FROM employees`);
            return parseInt(result.rows[0].count, 10);
        } catch (error) {
            logger.error('Failed to get employee count', { error: (error as Error).message });
            throw error;
        }
    }

    /**
     * Map database row to Employee object
     * Converts snake_case database columns to camelCase TypeScript interface
     */
    private mapRowToEmployee(row: any): Employee {
        return {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            position: row.position,
            salary: parseFloat(row.salary),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
}

// Export singleton instance
export const employeeService = new EmployeeService();
