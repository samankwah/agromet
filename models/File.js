import { query, transaction } from '../config/database.js';
import fs from 'fs';
import path from 'path';

class File {
  constructor(fileData = {}) {
    this.id = fileData.id;
    this.userId = fileData.user_id;
    this.originalName = fileData.original_name;
    this.storedFilename = fileData.stored_filename;
    this.filePath = fileData.file_path;
    this.fileSize = fileData.file_size;
    this.mimeType = fileData.mime_type;
    this.status = fileData.status || 'uploaded';
    this.contentType = fileData.content_type;
    this.processingLog = fileData.processing_log;
    this.metadata = fileData.metadata;
    this.uploadedAt = fileData.uploaded_at;
    this.processedAt = fileData.processed_at;
  }

  /**
   * Create new file record
   */
  static async create(fileData) {
    try {
      const {
        userId, originalName, storedFilename, filePath,
        fileSize, mimeType, contentType = null, metadata = null
      } = fileData;

      const result = await query(`
        INSERT INTO files (
          user_id, original_name, stored_filename, file_path,
          file_size, mime_type, content_type, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        userId, originalName, storedFilename, filePath,
        fileSize, mimeType, contentType,
        metadata ? JSON.stringify(metadata) : null
      ]);

      return new File(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create file record: ${error.message}`);
    }
  }

  /**
   * Find file by ID
   */
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM files WHERE id = $1', [id]);
      return result.rows.length > 0 ? new File(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find file by ID: ${error.message}`);
    }
  }

  /**
   * Find files with detailed information
   */
  static async findWithDetails(filters = {}) {
    try {
      const {
        userId, status, contentType, mimeType, search,
        uploadedAfter, uploadedBefore, page = 1, limit = 20
      } = filters;

      let baseQuery = `
        SELECT 
          f.*,
          u.name as uploaded_by_name,
          u.email as uploaded_by_email,
          COUNT(ar.id) as record_count
        FROM files f
        LEFT JOIN users u ON f.user_id = u.id
        LEFT JOIN agricultural_records ar ON f.id = ar.file_id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      // Add filters
      if (userId) {
        paramCount++;
        baseQuery += ` AND f.user_id = $${paramCount}`;
        params.push(userId);
      }

      if (status) {
        paramCount++;
        baseQuery += ` AND f.status = $${paramCount}`;
        params.push(status);
      }

      if (contentType) {
        paramCount++;
        baseQuery += ` AND f.content_type = $${paramCount}`;
        params.push(contentType);
      }

      if (mimeType) {
        paramCount++;
        baseQuery += ` AND f.mime_type = $${paramCount}`;
        params.push(mimeType);
      }

      if (search) {
        paramCount++;
        baseQuery += ` AND f.original_name ILIKE $${paramCount}`;
        params.push(`%${search}%`);
      }

      if (uploadedAfter) {
        paramCount++;
        baseQuery += ` AND f.uploaded_at >= $${paramCount}`;
        params.push(uploadedAfter);
      }

      if (uploadedBefore) {
        paramCount++;
        baseQuery += ` AND f.uploaded_at <= $${paramCount}`;
        params.push(uploadedBefore);
      }

      // Group by file fields and add pagination
      const offset = (page - 1) * limit;
      baseQuery += ` 
        GROUP BY f.id, u.name, u.email
        ORDER BY f.uploaded_at DESC 
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);

      const result = await query(baseQuery, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) FROM files f WHERE 1=1
      `;
      const countParams = [];
      let countParamIndex = 0;

      if (userId) {
        countParamIndex++;
        countQuery += ` AND f.user_id = $${countParamIndex}`;
        countParams.push(userId);
      }

      if (status) {
        countParamIndex++;
        countQuery += ` AND f.status = $${countParamIndex}`;
        countParams.push(status);
      }

      if (contentType) {
        countParamIndex++;
        countQuery += ` AND f.content_type = $${countParamIndex}`;
        countParams.push(contentType);
      }

      if (search) {
        countParamIndex++;
        countQuery += ` AND f.original_name ILIKE $${countParamIndex}`;
        countParams.push(`%${search}%`);
      }

      const countResult = await query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      return {
        files: result.rows.map(row => {
          const fileData = { ...row };
          // Parse metadata JSON if it exists
          if (fileData.metadata && typeof fileData.metadata === 'string') {
            try {
              fileData.metadata = JSON.parse(fileData.metadata);
            } catch (e) {
              // Keep as string if parsing fails
            }
          }
          return fileData;
        }),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find files with details: ${error.message}`);
    }
  }

  /**
   * Get files by user
   */
  static async getByUser(userId, filters = {}) {
    return await this.findWithDetails({ userId, ...filters });
  }

  /**
   * Get files by status
   */
  static async getByStatus(status, filters = {}) {
    return await this.findWithDetails({ status, ...filters });
  }

  /**
   * Update file status and processing information
   */
  async updateStatus(status, processingLog = null, contentType = null, metadata = null) {
    try {
      const updates = ['status = $2'];
      const params = [this.id, status];
      let paramCount = 2;

      if (processingLog !== null) {
        paramCount++;
        updates.push(`processing_log = $${paramCount}`);
        params.push(processingLog);
      }

      if (contentType !== null) {
        paramCount++;
        updates.push(`content_type = $${paramCount}`);
        params.push(contentType);
      }

      if (metadata !== null) {
        paramCount++;
        updates.push(`metadata = $${paramCount}`);
        params.push(JSON.stringify(metadata));
      }

      // Add processed_at timestamp for completed/failed status
      if (status === 'processed' || status === 'failed') {
        updates.push('processed_at = NOW()');
      }

      const result = await query(`
        UPDATE files 
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        throw new Error('File not found');
      }

      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      throw new Error(`Failed to update file status: ${error.message}`);
    }
  }

  /**
   * Mark file as processing
   */
  async markAsProcessing(processingLog = 'File processing started') {
    return await this.updateStatus('processing', processingLog);
  }

  /**
   * Mark file as processed
   */
  async markAsProcessed(contentType, metadata = null, processingLog = 'File processed successfully') {
    return await this.updateStatus('processed', processingLog, contentType, metadata);
  }

  /**
   * Mark file as failed
   */
  async markAsFailed(errorMessage) {
    const processingLog = `Processing failed: ${errorMessage}`;
    return await this.updateStatus('failed', processingLog);
  }

  /**
   * Get file statistics
   */
  static async getStatistics() {
    try {
      const result = await query(`
        SELECT 
          status,
          content_type,
          COUNT(*) as file_count,
          SUM(file_size) as total_size,
          AVG(file_size) as avg_size,
          MAX(uploaded_at) as latest_upload
        FROM files
        GROUP BY status, content_type
        ORDER BY status, content_type
      `);

      // Get overall statistics
      const overallResult = await query(`
        SELECT 
          COUNT(*) as total_files,
          SUM(file_size) as total_size,
          AVG(file_size) as average_size,
          COUNT(DISTINCT user_id) as unique_uploaders,
          COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count,
          COUNT(CASE WHEN status = 'uploaded' THEN 1 END) as pending_count
        FROM files
      `);

      return {
        byStatusAndType: result.rows,
        overall: overallResult.rows[0]
      };
    } catch (error) {
      throw new Error(`Failed to get file statistics: ${error.message}`);
    }
  }

  /**
   * Delete file record and physical file
   */
  async delete(deletePhysicalFile = true) {
    try {
      return await transaction(async (client) => {
        // Delete associated agricultural records first
        await client.query('DELETE FROM agricultural_records WHERE file_id = $1', [this.id]);
        
        // Delete file record
        await client.query('DELETE FROM files WHERE id = $1', [this.id]);

        // Delete physical file if requested and file exists
        if (deletePhysicalFile && this.filePath) {
          try {
            if (fs.existsSync(this.filePath)) {
              fs.unlinkSync(this.filePath);
              console.log(`🗑️ Physical file deleted: ${this.filePath}`);
            }
          } catch (fileError) {
            console.error(`⚠️ Warning: Could not delete physical file: ${fileError.message}`);
            // Don't throw error for physical file deletion failure
          }
        }

        return true;
      });
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get associated agricultural records
   */
  async getRecords(filters = {}) {
    try {
      const AgriculturalRecord = (await import('./AgriculturalRecord.js')).default;
      return await AgriculturalRecord.findWithDetails({
        fileId: this.id,
        ...filters
      });
    } catch (error) {
      throw new Error(`Failed to get file records: ${error.message}`);
    }
  }

  /**
   * Check if file exists on disk
   */
  async exists() {
    try {
      return this.filePath && fs.existsSync(this.filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file info (size, modified date, etc.)
   */
  async getFileInfo() {
    try {
      if (!this.filePath || !fs.existsSync(this.filePath)) {
        return null;
      }

      const stats = fs.statSync(this.filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.ctime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        exists: true
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * Generate download URL/token (for future implementation)
   */
  generateDownloadToken() {
    // This would generate a temporary download token
    // Implementation depends on your security requirements
    return {
      token: `${this.id}-${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    const json = { ...this };
    
    // Parse metadata if it's a string
    if (typeof json.metadata === 'string') {
      try {
        json.metadata = JSON.parse(json.metadata);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
    
    return json;
  }
}

export default File;