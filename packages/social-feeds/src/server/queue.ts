import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from '@/lib/redis';

const connection = (getRedisConnectionOptions() || {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
}) as any;

let queue: Queue;

export const getWorkflowQueue = () => {
    if (!queue) {
        queue = new Queue('workflow-execution', {
            connection,
        });
    }
    return queue;
};
