/**
 * Employee model definition
 * Represents the entity managed by the Data Warehouse servers
 */

export interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    position: string;
    salary: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateEmployeeDTO {
    firstName: string;
    lastName: string;
    position: string;
    salary: number;
}

export interface UpdateEmployeeDTO {
    firstName?: string;
    lastName?: string;
    position?: string;
    salary?: number;
}

