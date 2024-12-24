const db = require('../configs/database');

const auth = {
    getUserByEmail: (email) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM users WHERE email = ?',
                [email],
                (error, results) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(results[0]);
                }
            );
        });
    },

    createUser: (userData) => {
        return new Promise((resolve, reject) => {
            console.log('Creating user with data:', userData); // Debug log
            db.query(
                'INSERT INTO users (username, email, password, full_name, role, verification_token, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    userData.username,
                    userData.email,
                    userData.password,
                    userData.full_name,
                    userData.role || 'student',
                    userData.verification_token,
                    userData.email_verified
                ],
                (error, results) => {
                    if (error) {
                        console.error('Database error:', error); // Debug log
                        reject(error);
                        return;
                    }
                    console.log('User created:', results); // Debug log
                    resolve({ ...userData, id: results.insertId });
                }
            );
        });
    },

    getAllUsers: () => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, username, email, full_name, role FROM users';
            db.query(query, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    getUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM users 
                WHERE username = ? OR email = ?
            `;
            db.query(query, [username, username], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results[0]);
            });
        });
    },

    getUserByVerificationToken: (token) => {
        return new Promise((resolve, reject) => {
            console.log('Searching for token:', token); // Debug log
            db.query(
                'SELECT * FROM users WHERE verification_token = ?',
                [token],
                (error, results) => {
                    if (error) {
                        console.error('Database error:', error); // Debug log
                        reject(error);
                        return;
                    }
                    console.log('Query results:', results); // Debug log
                    resolve(results[0]);
                }
            );
        });
    },

    verifyEmail: (userId) => {
        return new Promise((resolve, reject) => {
            console.log('Verifying email for user:', userId);
            db.query(
                'UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = ?',
                [userId],
                (error, results) => {
                    if (error) {
                        console.error('Error verifying email:', error);
                        reject(error);
                        return;
                    }
                    console.log('Verification results:', results);
                    resolve(results);
                }
            );
        });
    },

    getUserByVerifiedToken: (token) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM users WHERE verification_token = ? AND email_verified = TRUE',
                [token],
                (error, results) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(results[0]);
                }
            );
        });
    }
}
module.exports = auth;