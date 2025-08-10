import { db } from '../db';
import { applicants, competitionRounds, stageSubmissions } from '../../shared/schema';
import { sql, eq, count, countDistinct, and } from 'drizzle-orm';
import { logger } from '../utils/logger';

export class MetricsService {
  // Batch dashboard statistics in a single optimized query
  async getDashboardStats() {
    const startTime = Date.now();
    
    try {
      // Use raw SQL for complex aggregations with proper indexing
      const result = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM ${applicants}) as total_applicants,
          (SELECT COUNT(*) FROM ${applicants} WHERE status = 'registered') as registered_count,
          (SELECT COUNT(*) FROM ${applicants} WHERE status = 'selected') as selected_count,
          (SELECT COUNT(*) FROM ${applicants} WHERE status = 'paid') as paid_count,
          (SELECT COUNT(DISTINCT college) FROM ${applicants}) as total_colleges,
          (SELECT COUNT(*) FROM ${competitionRounds} WHERE active = true) as active_rounds,
          (SELECT COUNT(*) FROM ${stageSubmissions}) as total_submissions
      `);

      const stats = result.rows[0] as any;
      
      logger.dbQuery('Dashboard stats aggregation', [], Date.now() - startTime);
      
      return {
        totalApplicants: parseInt(stats.total_applicants),
        registeredCount: parseInt(stats.registered_count),
        selectedCount: parseInt(stats.selected_count),
        paidCount: parseInt(stats.paid_count),
        totalColleges: parseInt(stats.total_colleges),
        activeRounds: parseInt(stats.active_rounds),
        totalSubmissions: parseInt(stats.total_submissions)
      };
    } catch (error) {
      logger.dbError('getDashboardStats', error as Error);
      throw error;
    }
  }

  // Optimized stage statistics with proper aggregation
  async getStageStatistics() {
    const startTime = Date.now();
    
    try {
      // Get stage stats with efficient joins and aggregations
      const result = await db.execute(sql`
        SELECT 
          cr.id as stage_id,
          cr.name as stage_name,
          cr.order_index,
          COUNT(DISTINCT CASE WHEN a.status = 'registered' OR a.status = 'selected' THEN a.id END) as total_participants,
          COUNT(DISTINCT ss.id) as submissions,
          COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN a.id END) as selected_count,
          COUNT(DISTINCT CASE WHEN a.status = 'won' THEN a.id END) as winners
        FROM ${competitionRounds} cr
        LEFT JOIN ${applicants} a ON (a.status = 'registered' OR a.status = 'selected' OR a.status = 'won')
        LEFT JOIN ${stageSubmissions} ss ON ss.stage_id = cr.id
        WHERE cr.active = true
        GROUP BY cr.id, cr.name, cr.order_index
        ORDER BY cr.order_index
      `);

      logger.dbQuery('Stage statistics aggregation', [], Date.now() - startTime);
      
      return {
        stages: result.rows.map((row: any) => ({
          stageId: row.stage_id,
          stageName: row.stage_name,
          orderIndex: row.order_index,
          totalParticipants: parseInt(row.total_participants) || 0,
          submissions: parseInt(row.submissions) || 0,
          selectedCount: parseInt(row.selected_count) || 0,
          winners: parseInt(row.winners) || 0
        }))
      };
    } catch (error) {
      logger.dbError('getStageStatistics', error as Error);
      throw error;
    }
  }

  // Efficient competition round data with minimal queries
  async getCompetitionRoundData(roundId: string) {
    const startTime = Date.now();
    
    try {
      // Single query to get all round-related metrics
      const result = await db.execute(sql`
        SELECT 
          cr.*,
          COUNT(DISTINCT a.id) as participant_count,
          COUNT(DISTINCT a.college) as college_count,
          COUNT(DISTINCT ss.id) as submission_count,
          COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN a.id END) as selected_count,
          COUNT(DISTINCT CASE WHEN a.status = 'won' THEN a.id END) as winner_count
        FROM ${competitionRounds} cr
        LEFT JOIN ${applicants} a ON (a.status IN ('registered', 'selected', 'won'))
        LEFT JOIN ${stageSubmissions} ss ON ss.stage_id = cr.id
        WHERE cr.id = ${roundId}
        GROUP BY cr.id
      `);

      logger.dbQuery(`Competition round data for ${roundId}`, [], Date.now() - startTime);
      
      if (result.rows.length === 0) {
        return null;
      }

      const data = result.rows[0] as any;
      return {
        ...data,
        participantCount: parseInt(data.participant_count) || 0,
        collegeCount: parseInt(data.college_count) || 0,
        submissionCount: parseInt(data.submission_count) || 0,
        selectedCount: parseInt(data.selected_count) || 0,
        winnerCount: parseInt(data.winner_count) || 0
      };
    } catch (error) {
      logger.dbError('getCompetitionRoundData', error as Error, { roundId });
      throw error;
    }
  }

  // Generic aggregation function for reusable metrics
  async getApplicantMetrics(filters: {
    status?: string;
    college?: string;
    stageId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}) {
    const startTime = Date.now();
    
    try {
      let whereConditions = [];
      const params: any[] = [];

      if (filters.status) {
        whereConditions.push(`a.status = $${params.length + 1}`);
        params.push(filters.status);
      }

      if (filters.college) {
        whereConditions.push(`a.college = $${params.length + 1}`);
        params.push(filters.college);
      }

      if (filters.dateFrom) {
        whereConditions.push(`a.created_at >= $${params.length + 1}`);
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        whereConditions.push(`a.created_at <= $${params.length + 1}`);
        params.push(filters.dateTo);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      const query = `
        SELECT 
          COUNT(*) as total_count,
          COUNT(DISTINCT college) as unique_colleges,
          COUNT(CASE WHEN status = 'registered' THEN 1 END) as registered,
          COUNT(CASE WHEN status = 'selected' THEN 1 END) as selected,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
          COUNT(CASE WHEN status = 'won' THEN 1 END) as winners
        FROM ${applicants} a
        ${whereClause}
      `;

      const result = await db.execute(sql.raw(query, params));
      
      logger.dbQuery('Applicant metrics aggregation', params, Date.now() - startTime);
      
      const metrics = result.rows[0] as any;
      return {
        totalCount: parseInt(metrics.total_count),
        uniqueColleges: parseInt(metrics.unique_colleges),
        registered: parseInt(metrics.registered),
        selected: parseInt(metrics.selected),
        paid: parseInt(metrics.paid),
        winners: parseInt(metrics.winners)
      };
    } catch (error) {
      logger.dbError('getApplicantMetrics', error as Error, { filters });
      throw error;
    }
  }
}

export const metricsService = new MetricsService();