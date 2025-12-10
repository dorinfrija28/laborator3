/**
 * Load Balancer Implementation
 * 
 * The load balancer distributes incoming requests across multiple DW servers
 * to achieve:
 * - Scalability: Distribute load across multiple servers
 * - Fault tolerance: If one server fails, others can handle requests
 * - Performance: Parallel processing of requests
 * 
 * Algorithm: Round-Robin
 * - Maintains an index pointing to the next server
 * - Cycles through servers in order: DW1 → DW2 → DW3 → DW1 → ...
 * - Ensures even distribution of requests over time
 * 
 * This achieves transparency in distribution because:
 * - Clients only see the proxy (single entry point)
 * - The proxy hides the complexity of multiple backend servers
 * - Clients don't need to know which DW server handles their request
 */

import { LoadBalancerConfig } from './types';
import { logger } from '../shared/logger';

export class LoadBalancer {
    private servers: string[];
    private currentIndex: number = 0;
    private algorithm: 'round-robin';

    constructor(config: LoadBalancerConfig) {
        this.servers = config.servers;
        this.algorithm = config.algorithm;

        if (this.servers.length === 0) {
            throw new Error('At least one server must be configured');
        }

        logger.info('Load balancer initialized', {
            algorithm: this.algorithm,
            serverCount: this.servers.length,
            servers: this.servers,
        });
    }

    /**
     * Get the next server using Round-Robin algorithm
     */
    getNextServer(): string {
        const server = this.servers[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.servers.length;
        return server;
    }

    /**
     * Get all configured servers
     */
    getServers(): string[] {
        return [...this.servers];
    }

    /**
     * Get current server index (for metrics/logging)
     */
    getCurrentIndex(): number {
        return this.currentIndex;
    }
}

