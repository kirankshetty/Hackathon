// Simple in-memory cache for dashboard statistics
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cache dashboard stats for 5 minutes
  async getDashboardStats<T>(fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = 'dashboard_stats';
    let stats = this.get<T>(cacheKey);
    
    if (!stats) {
      stats = await fetchFn();
      this.set(cacheKey, stats, 5);
    }
    
    return stats;
  }

  // Cache stage statistics for 3 minutes
  async getStageStats<T>(fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = 'stage_stats';
    let stats = this.get<T>(cacheKey);
    
    if (!stats) {
      stats = await fetchFn();
      this.set(cacheKey, stats, 3);
    }
    
    return stats;
  }

  // Invalidate related caches when data changes
  invalidateStats(): void {
    this.delete('dashboard_stats');
    this.delete('stage_stats');
    // Clear any applicant-related caches
    for (const [key] of this.cache) {
      if (key.startsWith('applicant_') || key.startsWith('competition_')) {
        this.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();