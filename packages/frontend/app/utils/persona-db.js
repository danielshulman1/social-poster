/**
 * Persona Database Operations
 * CRUD operations for user personas and onboarding progress
 */

import { query } from './db';

/**
 * Ensure user_personas table exists
 */
export async function ensureUserPersonasTable() {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS user_personas (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        persona_data JSONB NOT NULL,
        platforms_connected VARCHAR(100)[] DEFAULT '{}',
        posts_analysed_count INTEGER DEFAULT 0,
        onboarding_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await query(
      `CREATE INDEX IF NOT EXISTS idx_user_personas_user_id ON user_personas(user_id)`
    );

    console.log('[ensureUserPersonasTable] Table created successfully');
  } catch (error) {
    console.error('[ensureUserPersonasTable] Error:', error.message);
  }
}

/**
 * Get user's persona
 */
export async function getUserPersona(userId) {
  try {
    const result = await query(
      `SELECT * FROM user_personas WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('[getUserPersona] Error:', error.message);
    throw error;
  }
}

/**
 * Create initial persona record
 */
export async function createPersonaRecord(userId) {
  try {
    const result = await query(
      `INSERT INTO user_personas (user_id, persona_data, onboarding_complete)
       VALUES ($1, $2, false)
       RETURNING *`,
      [userId, JSON.stringify({})]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      return await getUserPersona(userId);
    }
    throw error;
  }
}

/**
 * Save completed persona
 */
export async function savePersona(userId, personaData, platformsConnected, postsCount) {
  try {
    const result = await query(
      `UPDATE user_personas
       SET persona_data = $1,
           platforms_connected = $2,
           posts_analysed_count = $3,
           onboarding_complete = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4
       RETURNING *`,
      [JSON.stringify(personaData), platformsConnected, postsCount, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User persona not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[savePersona] Error:', error.message);
    throw error;
  }
}

/**
 * Update persona data
 */
export async function updatePersona(userId, personaData) {
  try {
    const result = await query(
      `UPDATE user_personas
       SET persona_data = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING *`,
      [JSON.stringify(personaData), userId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[updatePersona] Error:', error.message);
    throw error;
  }
}

/**
 * Clear persona (admin reset)
 */
export async function clearPersona(userId) {
  try {
    const result = await query(
      `UPDATE user_personas
       SET persona_data = '{}',
           platforms_connected = '{}',
           posts_analysed_count = 0,
           onboarding_complete = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [userId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[clearPersona] Error:', error.message);
    throw error;
  }
}

/**
 * Ensure interview_progress table exists
 */
export async function ensureInterviewProgressTable() {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS interview_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        current_step INTEGER DEFAULT 1,
        interview_answers JSONB DEFAULT '{}'::jsonb,
        posts_choice VARCHAR(50),
        collected_posts JSONB DEFAULT '[]'::jsonb,
        social_credentials JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await query(
      `CREATE INDEX IF NOT EXISTS idx_interview_progress_user_id ON interview_progress(user_id)`
    );

    console.log('[ensureInterviewProgressTable] Table created successfully');
  } catch (error) {
    console.error('[ensureInterviewProgressTable] Error:', error.message);
  }
}

/**
 * Get interview progress
 */
export async function getInterviewProgress(userId) {
  try {
    const result = await query(
      `SELECT * FROM interview_progress WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('[getInterviewProgress] Error:', error.message);
    throw error;
  }
}

/**
 * Create interview progress record
 */
export async function createInterviewProgress(userId) {
  try {
    const result = await query(
      `INSERT INTO interview_progress (user_id, current_step)
       VALUES ($1, 1)
       RETURNING *`,
      [userId]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      return await getInterviewProgress(userId);
    }
    throw error;
  }
}

/**
 * Update interview progress
 */
export async function updateInterviewProgress(userId, updates) {
  try {
    const fields = [];
    const values = [userId];
    let paramIndex = 2;

    if (updates.currentStep !== undefined) {
      fields.push(`current_step = $${paramIndex}`);
      values.push(updates.currentStep);
      paramIndex++;
    }

    if (updates.interviewAnswers !== undefined) {
      fields.push(`interview_answers = $${paramIndex}`);
      values.push(JSON.stringify(updates.interviewAnswers));
      paramIndex++;
    }

    if (updates.postsChoice !== undefined) {
      fields.push(`posts_choice = $${paramIndex}`);
      values.push(updates.postsChoice);
      paramIndex++;
    }

    if (updates.collectedPosts !== undefined) {
      fields.push(`collected_posts = $${paramIndex}`);
      values.push(JSON.stringify(updates.collectedPosts));
      paramIndex++;
    }

    if (updates.socialCredentials !== undefined) {
      fields.push(`social_credentials = $${paramIndex}`);
      values.push(JSON.stringify(updates.socialCredentials));
      paramIndex++;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    const query_text = `
      UPDATE interview_progress
      SET ${fields.join(', ')}
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await query(query_text, values);

    if (result.rows.length === 0) {
      throw new Error('Interview progress not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[updateInterviewProgress] Error:', error.message);
    throw error;
  }
}

/**
 * Clear interview progress (after persona is saved)
 */
export async function clearInterviewProgress(userId) {
  try {
    await query(
      `DELETE FROM interview_progress WHERE user_id = $1`,
      [userId]
    );

    console.log('[clearInterviewProgress] Progress cleared for user', userId);
  } catch (error) {
    console.error('[clearInterviewProgress] Error:', error.message);
  }
}
