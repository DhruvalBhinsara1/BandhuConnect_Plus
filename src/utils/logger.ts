// Enhanced logging utility for debugging auto-assignment and React issues
export class Logger {
  private static isDev = __DEV__;
  
  // Auto-assignment specific logging
  static autoAssignment = {
    start: (requestCount: number) => {
      if (this.isDev) {
        console.log(`🔄 [AUTO-ASSIGN] Starting batch assignment for ${requestCount} requests`);
      }
    },
    
    requestProcessing: (request: any, index: number, total: number) => {
      if (this.isDev) {
        console.log(`🔄 [AUTO-ASSIGN] Processing request ${index + 1}/${total}:`, {
          id: request.id,
          type: request.type,
          priority: request.priority,
          title: request.title?.substring(0, 50) + '...'
        });
      }
    },
    
    volunteerScoring: (volunteers: any[], requestType: string) => {
      if (this.isDev) {
        console.log(`🔍 [AUTO-ASSIGN] Scoring ${volunteers.length} volunteers for type: ${requestType}`);
        volunteers.forEach((v, i) => {
          console.log(`  ${i + 1}. ${v.name} (${v.volunteer_status}) - Skills: [${v.skills?.join(', ')}]`);
        });
      }
    },
    
    matchResult: (success: boolean, volunteerName?: string, score?: number, reason?: string) => {
      if (this.isDev) {
        if (success) {
          console.log(`✅ [AUTO-ASSIGN] Match found: ${volunteerName} (Score: ${(score! * 100).toFixed(1)}%)`);
        } else {
          console.log(`❌ [AUTO-ASSIGN] No match found: ${reason}`);
        }
      }
    },
    
    batchComplete: (successful: number, total: number, details: any[]) => {
      if (this.isDev) {
        console.log(`🏁 [AUTO-ASSIGN] Batch complete: ${successful}/${total} successful`);
        console.log('📊 [AUTO-ASSIGN] Detailed results:', details.map(d => ({
          success: d.success,
          volunteer: d.assigned_volunteer_id ? 'Assigned' : 'Failed',
          score: d.match_score,
          reason: d.message?.substring(0, 50) + '...'
        })));
      }
    },
    
    error: (error: any, context?: string) => {
      console.error(`❌ [AUTO-ASSIGN] Error${context ? ` in ${context}` : ''}:`, error);
    }
  };
  
  // React component debugging
  static react = {
    duplicateKey: (componentName: string, duplicateKey: string, items: any[]) => {
      console.warn(`⚠️ [REACT] Duplicate key "${duplicateKey}" in ${componentName}`);
      console.warn('🔍 [REACT] Items causing duplicate keys:', items.filter(item => 
        (typeof item === 'object' && item.key === duplicateKey) || 
        (typeof item === 'string' && item === duplicateKey)
      ));
    },
    
    renderList: (componentName: string, listName: string, items: any[]) => {
      if (this.isDev) {
        console.log(`📋 [REACT] ${componentName} rendering ${listName}:`, items.map(item => ({
          key: item.id || item.key || item.value || 'NO_KEY',
          type: item.type || item.label || 'NO_TYPE'
        })));
      }
    },
    
    keyGeneration: (items: any[], keyField: string) => {
      const keys = items.map(item => item[keyField]);
      const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
      
      if (duplicates.length > 0) {
        console.warn(`⚠️ [REACT] Duplicate keys found in ${keyField}:`, [...new Set(duplicates)]);
        return false;
      }
      return true;
    }
  };
  
  // Database operation logging
  static database = {
    query: (operation: string, table: string, params?: any) => {
      if (this.isDev) {
        console.log(`🗄️ [DB] ${operation} on ${table}`, params ? { params } : '');
      }
    },
    
    result: (operation: string, result: any) => {
      if (this.isDev) {
        console.log(`✅ [DB] ${operation} result:`, {
          success: !result.error,
          count: result.data?.length || (result.data ? 1 : 0),
          error: result.error?.message
        });
      }
    },
    
    error: (operation: string, error: any) => {
      console.error(`❌ [DB] ${operation} failed:`, error);
    }
  };
  
  // General purpose logging
  static info = (message: string, data?: any) => {
    if (this.isDev) {
      console.log(`ℹ️ [INFO] ${message}`, data || '');
    }
  };
  
  static warn = (message: string, data?: any) => {
    console.warn(`⚠️ [WARN] ${message}`, data || '');
  };
  
  static error = (message: string, error?: any) => {
    console.error(`❌ [ERROR] ${message}`, error || '');
  };
  
  // Performance logging
  static perf = {
    start: (operation: string) => {
      if (this.isDev) {
        console.time(`⏱️ [PERF] ${operation}`);
      }
    },
    
    end: (operation: string) => {
      if (this.isDev) {
        console.timeEnd(`⏱️ [PERF] ${operation}`);
      }
    }
  };
}
