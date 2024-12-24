const db = require('../configs/database');

const checkEnrollment = (userId, courseId, callback) => {
  db.query(
    'SELECT * FROM course_enrollments WHERE user_id = ? AND course_id = ?',
    [userId, courseId],
    (error, results) => {
      if (error) {
        return callback(error, null);
      }
      callback(null, results.length > 0);
    }
  );
};

const enrollUserInCourse = (userId, courseId, callback) => {
  db.query(
    'INSERT INTO course_enrollments (user_id, course_id) VALUES (?, ?)',
    [userId, courseId],
    (error, results) => {
      if (error) {
        return callback(error, null);
      }
      callback(null, results);
    }
  );
};

const getTeacherStats = (teacherId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                c.id as course_id,
                c.title as course_title,
                COUNT(DISTINCT ce.user_id) as student_count
            FROM courses c
            LEFT JOIN course_enrollments ce ON c.id = ce.course_id
            WHERE c.teacher_id = ?
            GROUP BY c.id, c.title
        `;

        db.query(query, [teacherId], (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(results);
        });
    });
}

const getEnrolledCourses = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.*,
        u.full_name as teacher_name,
        ce.enrolled_at as enrollment_date
      FROM courses c
      JOIN course_enrollments ce ON c.id = ce.course_id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE ce.user_id = ?
      ORDER BY ce.enrolled_at DESC
    `;
    
    db.query(query, [userId], (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
};

const getCourseDetails = (courseId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.*,
        u.full_name as teacher_name,
        COUNT(DISTINCT v.id) as total_videos,
        COUNT(DISTINCT d.id) as total_documents,
        COUNT(DISTINCT ce.user_id) as total_students
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN videos v ON c.id = v.course_id
      LEFT JOIN documents d ON c.id = d.course_id
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id
      WHERE c.id = ?
      GROUP BY c.id
    `;

    db.query(query, [courseId], (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      
      if (results.length === 0) {
        resolve(null);
        return;
      }

      resolve(results[0]);
    });
  });
};

const getEnrollmentDetailsByTeacher = (teacherId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.thumbnail,
        u.id as student_id,
        u.full_name as student_name,
        u.email as student_email,
        ce.enrolled_at,
        COUNT(DISTINCT v.id) as total_videos,
        COUNT(DISTINCT CASE WHEN vc.is_completed = 1 THEN v.id END) as completed_videos,
        COUNT(DISTINCT d.id) as total_documents
      FROM courses c
      JOIN course_enrollments ce ON c.id = ce.course_id
      JOIN users u ON ce.user_id = u.id
      LEFT JOIN videos v ON c.id = v.course_id
      LEFT JOIN video_completion vc ON v.id = vc.video_id AND vc.user_id = u.id
      LEFT JOIN documents d ON c.id = d.course_id
      WHERE c.teacher_id = ?
      GROUP BY c.id, u.id
      ORDER BY ce.enrolled_at DESC
    `;

    db.query(query, [teacherId], (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      const coursesMap = new Map();
      
      results.forEach(row => {
        if (!coursesMap.has(row.course_id)) {
          coursesMap.set(row.course_id, {
            id: row.course_id,
            title: row.course_title,
            thumbnail: row.thumbnail,
            total_videos: row.total_videos,
            total_documents: row.total_documents,
            students: []
          });
        }

        const progress = row.total_videos > 0 
          ? Math.round((row.completed_videos / row.total_videos) * 100) 
          : 0;

        coursesMap.get(row.course_id).students.push({
          id: row.student_id,
          name: row.student_name,
          email: row.student_email,
          enrolled_at: row.enrolled_at,
          completed_videos: row.completed_videos,
          total_videos: row.total_videos,
          progress: progress
        });
      });

      resolve(Array.from(coursesMap.values()));
    });
  });
};

module.exports = {
  checkEnrollment,
  enrollUserInCourse,
  getTeacherStats,
  getEnrolledCourses,
  getCourseDetails,
  getEnrollmentDetailsByTeacher
}; 