const db = require('../config/database');

const classModel = {
    getTeacherClasses: (teacherId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.*, 
                       COUNT(DISTINCT cs.student_id) as student_count,
                       COUNT(DISTINCT cc.course_id) as course_count
                FROM classes c
                LEFT JOIN class_students cs ON c.id = cs.class_id
                LEFT JOIN class_courses cc ON c.id = cc.class_id
                WHERE c.teacher_id = ?
                GROUP BY c.id
                ORDER BY c.created_at DESC
            `;
            db.query(sql, [teacherId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    getClassById: (classId, teacherId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM classes WHERE id = ? AND teacher_id = ?';
            db.query(sql, [classId, teacherId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results[0]);
            });
        });
    },

    getClassStudents: (classId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.id, u.fullname, u.email, cs.status, cs.joined_at
                FROM class_students cs
                JOIN users u ON cs.student_id = u.id
                WHERE cs.class_id = ?
            `;
            db.query(sql, [classId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    getClassCourses: (classId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.* 
                FROM courses c
                INNER JOIN class_courses cc ON c.id = cc.course_id
                WHERE cc.class_id = ?
            `;
            
            db.query(sql, [classId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    createClass: (classData) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO classes SET ?';
            db.query(sql, classData, (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                db.query('SELECT * FROM classes WHERE id = ?', [result.insertId], (error, results) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(results[0]);
                });
            });
        });
    },

    updateClass: (classId, teacherId, classData) => {
        return new Promise((resolve, reject) => {
            const checkSql = 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';
            db.query(checkSql, [classId, teacherId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (results.length === 0) {
                    resolve(null);
                    return;
                }

                const updateSql = 'UPDATE classes SET ? WHERE id = ?';
                db.query(updateSql, [classData, classId], (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    db.query('SELECT * FROM classes WHERE id = ?', [classId], (error, results) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve(results[0]);
                    });
                });
            });
        });
    },

    deleteClass: (classId, teacherId) => {
        return new Promise((resolve, reject) => {
            const checkSql = 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';
            db.query(checkSql, [classId, teacherId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (results.length === 0) {
                    resolve(false);
                    return;
                }

                const deleteSql = 'DELETE FROM classes WHERE id = ?';
                db.query(deleteSql, [classId], (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(true);
                });
            });
        });
    },

    addCourseToClass: (classId, courseId, teacherId) => {
        return new Promise((resolve, reject) => {
            const checkSql = `
                SELECT c.id 
                FROM classes c
                JOIN courses co ON co.teacher_id = c.teacher_id
                WHERE c.id = ? AND c.teacher_id = ? AND co.id = ?
            `;
            db.query(checkSql, [classId, teacherId, courseId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (results.length === 0) {
                    reject(new Error('Không có quyền thêm khóa học vào lớp này'));
                    return;
                }

                const insertSql = 'INSERT INTO class_courses (class_id, course_id) VALUES (?, ?)';
                db.query(insertSql, [classId, courseId], (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(result);
                });
            });
        });
    },

    removeCourseFromClass: (classId, courseId, teacherId) => {
        return new Promise((resolve, reject) => {
            const checkSql = 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';
            db.query(checkSql, [classId, teacherId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (results.length === 0) {
                    reject(new Error('Không có quyền xóa khóa học khỏi lớp này'));
                    return;
                }

                const deleteSql = 'DELETE FROM class_courses WHERE class_id = ? AND course_id = ?';
                db.query(deleteSql, [classId, courseId], (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(result);
                });
            });
        });
    },

    getEnrolledClasses: (studentId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    c.*,
                    u.full_name as teacher_name
                FROM classes c
                INNER JOIN class_students cs ON c.id = cs.class_id
                INNER JOIN users u ON c.teacher_id = u.id
                WHERE cs.student_id = ? 
                AND cs.status = 'active'
                ORDER BY cs.joined_at DESC
            `;
            
            db.query(sql, [studentId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    getClassByCode: (classCode) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM classes WHERE class_code = ?';
            db.query(sql, [classCode], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results[0]);
            });
        });
    },

    getClassStudentCount: (classId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT COUNT(*) as count FROM class_students WHERE class_id = ? AND status = "active"';
            db.query(sql, [classId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results[0].count);
            });
        });
    },

    isStudentEnrolled: (classId, studentId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT COUNT(*) as count FROM class_students WHERE class_id = ? AND student_id = ? AND status = "active"';
            db.query(sql, [classId, studentId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results[0].count > 0);
            });
        });
    },

    addStudentToClass: (classId, studentId) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO class_students (class_id, student_id) VALUES (?, ?)';
            db.query(sql, [classId, studentId], (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            });
        });
    },

    removeStudentFromClass: (classId, studentId) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE class_students SET status = "inactive" WHERE class_id = ? AND student_id = ?';
            db.query(sql, [classId, studentId], (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            });
        });
    },

    getClassCoursesByStudent: (classId, studentId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    c.id,
                    c.title,
                    c.thumbnail,
                    u.full_name as teacher_name
                FROM class_courses cc
                JOIN courses c ON cc.course_id = c.id
                JOIN users u ON c.teacher_id = u.id
                WHERE cc.class_id = ?
                ORDER BY c.created_at DESC
            `;
            
            db.query(sql, [classId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    }
};

module.exports = classModel; 