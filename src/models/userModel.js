const db = require('../config/database');

const User = {
  findById: async (userId) => {
    try {
      return new Promise((resolve, reject) => {
        db.query(
          'SELECT id, username, email, full_name, role, avatar, created_at FROM users WHERE id = ?',
          [userId],
          (error, results) => {
            if (error) {
              return reject(error);
            }
            resolve(results[0]);
          }
        );
      });
    } catch (error) {
      throw error;
    }
  },

  updateFullName: async (userId, fullName) => {
    try {
      return new Promise((resolve, reject) => {
        db.query(
          'UPDATE users SET full_name = ? WHERE id = ?',
          [fullName, userId],
          (error, results) => {
            if (error) {
              return reject(error);
            }
            resolve(true);
          }
        );
      });
    } catch (error) {
      throw error;
    }
  },

  updateAvatar: async (userId, avatarUrl) => {
    try {
      return new Promise((resolve, reject) => {
        db.query(
          'UPDATE users SET avatar = ? WHERE id = ?',
          [avatarUrl, userId],
          (error, results) => {
            if (error) {
              return reject(error);
            }
            resolve(true);
          }
        );
      });
    } catch (error) {
      throw error;
    }
  },

  // Lấy avatar hiện tại của user
  getCurrentAvatar: async (userId) => {
    try {
      return new Promise((resolve, reject) => {
        db.query(
          'SELECT avatar FROM users WHERE id = ?',
          [userId],
          (error, results) => {
            if (error) {
              return reject(error);
            }
            resolve(results[0]?.avatar);
          }
        );
      });
    } catch (error) {
      throw error;
    }
  },
};

module.exports = User; 