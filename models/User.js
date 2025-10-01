import { query, transaction } from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  constructor(userData = {}) {
    this.id = userData.id;
    this.name = userData.name;
    this.email = userData.email;
    this.passwordHash = userData.password_hash;
    this.organization = userData.organization;
    this.role = userData.role || 'user';
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
    this.lastLogin = userData.last_login;
  }

  /**
   * Create a new user
   */
  static async create({ name, email, password, organization = null, role = 'user' }) {
    try {
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = await query(`
        INSERT INTO users (name, email, password_hash, organization, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [name.trim(), email.toLowerCase().trim(), passwordHash, organization, role]);

      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('User with this email already exists');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase().trim()]
      );

      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Get all users with pagination
   */
  static async getAll({ page = 1, limit = 20, role = null, search = null }) {
    try {
      let baseQuery = `
        SELECT * FROM users 
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 0;

      // Add role filter
      if (role) {
        paramCount++;
        baseQuery += ` AND role = $${paramCount}`;
        params.push(role);
      }

      // Add search filter
      if (search) {
        paramCount++;
        baseQuery += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR organization ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      // Add pagination
      const offset = (page - 1) * limit;
      baseQuery += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await query(baseQuery, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
      const countParams = [];
      let countParamIndex = 0;

      if (role) {
        countParamIndex++;
        countQuery += ` AND role = $${countParamIndex}`;
        countParams.push(role);
      }

      if (search) {
        countParamIndex++;
        countQuery += ` AND (name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex} OR organization ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
      }

      const countResult = await query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      return {
        users: result.rows.map(row => new User(row)),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  /**
   * Update user information
   */
  async update(updateData) {
    try {
      const allowedFields = ['name', 'email', 'organization', 'role'];
      const updateFields = [];
      const params = [];
      let paramCount = 0;

      // Build dynamic update query
      Object.keys(updateData).forEach(field => {
        if (allowedFields.includes(field) && updateData[field] !== undefined) {
          paramCount++;
          if (field === 'email') {
            updateFields.push(`${field} = $${paramCount}`);
            params.push(updateData[field].toLowerCase().trim());
          } else {
            updateFields.push(`${field} = $${paramCount}`);
            params.push(updateData[field]);
          }
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      paramCount++;
      params.push(this.id);

      const result = await query(`
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      // Update current instance
      const updatedUser = result.rows[0];
      Object.assign(this, updatedUser);
      
      return this;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email already exists');
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, this.id]
      );

      this.passwordHash = passwordHash;
      return this;
    } catch (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin() {
    try {
      const result = await query(
        'UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING last_login',
        [this.id]
      );

      this.lastLogin = result.rows[0].last_login;
      return this;
    } catch (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.passwordHash);
    } catch (error) {
      throw new Error(`Failed to verify password: ${error.message}`);
    }
  }

  /**
   * Delete user (soft delete by updating status)
   */
  async delete() {
    try {
      await query('DELETE FROM users WHERE id = $1', [this.id]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Get user's uploaded files
   */
  async getFiles({ page = 1, limit = 10, status = null, contentType = null }) {
    try {
      let baseQuery = `
        SELECT f.*, COUNT(ar.id) as record_count
        FROM files f
        LEFT JOIN agricultural_records ar ON f.id = ar.file_id
        WHERE f.user_id = $1
      `;
      
      const params = [this.id];
      let paramCount = 1;

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

      const offset = (page - 1) * limit;
      baseQuery += ` 
        GROUP BY f.id 
        ORDER BY f.uploaded_at DESC 
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);

      const result = await query(baseQuery, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get user files: ${error.message}`);
    }
  }

  /**
   * Get user statistics
   */
  async getStatistics() {
    try {
      const result = await query(`
        SELECT 
          COUNT(DISTINCT f.id) as total_files,
          COUNT(DISTINCT ar.id) as total_records,
          COUNT(DISTINCT CASE WHEN f.status = 'processed' THEN f.id END) as processed_files,
          COUNT(DISTINCT CASE WHEN f.status = 'failed' THEN f.id END) as failed_files
        FROM files f
        LEFT JOIN agricultural_records ar ON f.id = ar.file_id
        WHERE f.user_id = $1
      `, [this.id]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }

  /**
   * Convert to JSON (exclude sensitive data)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      organization: this.organization,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin
    };
  }
}

export default User;