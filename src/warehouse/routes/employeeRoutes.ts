/**
 * Employee Routes - HTTP request handlers (Controller layer)
 * Maps HTTP requests to service methods and handles response formatting
 */

import { Request, Response } from 'express';
import { employeeService } from '../services/employeeService';
import { getResponseFormat, parseQuery, getContentType } from '../../shared/httpUtils';
import { formatResponse } from '../../shared/formatters';
import { logger } from '../../shared/logger';

/**
 * GET /employees - Retrieve all employees with pagination
 * Query params: offset, limit, format
 */
export function getAllEmployees(req: Request, res: Response): void {
    try {
        const query = parseQuery(req.url || '');
        const offset = parseInt(query.offset || '0', 10);
        const limit = parseInt(query.limit || '100', 10);
        const format = getResponseFormat(req, query);

        const employees = employeeService.getAll(offset, limit);
        const response = {
            data: employees,
            total: employeeService.getCount(),
            offset,
            limit,
        };

        res.setHeader('Content-Type', getContentType(format));
        res.status(200).send(formatResponse(response, format));

        logger.info('GET /employees', { offset, limit, format, count: employees.length });
    } catch (error) {
        logger.error('Error in getAllEmployees', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * GET /employees/:id - Retrieve a single employee by ID
 * Query params: format
 */
export function getEmployeeById(req: Request, res: Response): void {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid employee ID' });
            return;
        }

        const query = parseQuery(req.url || '');
        const format = getResponseFormat(req, query);

        const employee = employeeService.getById(id);
        if (!employee) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }

        res.setHeader('Content-Type', getContentType(format));
        res.status(200).send(formatResponse({ data: employee }, format));

        logger.info('GET /employees/:id', { id, format });
    } catch (error) {
        logger.error('Error in getEmployeeById', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * POST /employees - Create a new employee
 */
export async function createEmployee(req: Request, res: Response): Promise<void> {
    try {
        const { firstName, lastName, position, salary } = req.body;

        if (!firstName || !lastName || !position || typeof salary !== 'number') {
            res.status(400).json({
                error: 'Missing required fields: firstName, lastName, position, salary',
            });
            return;
        }

        const employee = employeeService.create({
            firstName,
            lastName,
            position,
            salary,
        });

        res.status(201).json({ data: employee, message: 'Employee created successfully' });

        logger.info('POST /employees', { employeeId: employee.id });
    } catch (error) {
        logger.error('Error in createEmployee', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * PUT /employees/:id - Update an existing employee
 */
export function updateEmployee(req: Request, res: Response): void {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid employee ID' });
            return;
        }

        const updateData = req.body;
        const employee = employeeService.update(id, updateData);

        if (!employee) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }

        res.status(200).json({ data: employee, message: 'Employee updated successfully' });

        logger.info('PUT /employees/:id', { id });
    } catch (error) {
        logger.error('Error in updateEmployee', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * DELETE /employees/:id - Delete an employee
 */
export function deleteEmployee(req: Request, res: Response): void {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid employee ID' });
            return;
        }

        const deleted = employeeService.delete(id);
        if (!deleted) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }

        res.status(200).json({ message: 'Employee deleted successfully' });

        logger.info('DELETE /employees/:id', { id });
    } catch (error) {
        logger.error('Error in deleteEmployee', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * GET /update/employees - Optional PULL-style endpoint for updates polling
 * Returns all employees (useful for synchronization scenarios)
 */
export function getUpdateEmployees(req: Request, res: Response): void {
    try {
        const query = parseQuery(req.url || '');
        const format = getResponseFormat(req, query);

        const employees = employeeService.getAll();
        const response = {
            data: employees,
            total: employeeService.getCount(),
            timestamp: new Date().toISOString(),
        };

        res.setHeader('Content-Type', getContentType(format));
        res.status(200).send(formatResponse(response, format));

        logger.info('GET /update/employees', { format, count: employees.length });
    } catch (error) {
        logger.error('Error in getUpdateEmployees', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

