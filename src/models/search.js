const db = require('../configs/database');

const search = {
    searchCourses: (searchParams) => {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    c.*,
                    u.full_name as teacher_name,
                    COUNT(DISTINCT ce.user_id) as total_students,
                    COUNT(DISTINCT v.id) as total_videos,
                    COUNT(DISTINCT d.id) as total_documents
                FROM courses c
                LEFT JOIN users u ON c.teacher_id = u.id
                LEFT JOIN course_enrollments ce ON c.id = ce.course_id
                LEFT JOIN videos v ON c.id = v.course_id 
                LEFT JOIN documents d ON c.id = d.course_id
                WHERE c.is_public = 1
            `;

            const queryParams = [];

            // Tìm theo keyword
            if (searchParams.keyword) {
                query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
                queryParams.push(`%${searchParams.keyword}%`);
                queryParams.push(`%${searchParams.keyword}%`);
            }

            // Lọc theo teacher
            if (searchParams.teacherId) {
                query += ` AND c.teacher_id = ?`;
                queryParams.push(searchParams.teacherId);
            }

            // Group by để tránh duplicate do LEFT JOIN
            query += ` GROUP BY c.id`;

            // Sắp xếp
            const validSortFields = ['created_at', 'total_students'];
            const sortBy = validSortFields.includes(searchParams.sortBy) 
                ? searchParams.sortBy 
                : 'created_at';
            const sortOrder = searchParams.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            query += ` ORDER BY ${sortBy} ${sortOrder}`;

            // Phân trang
            const page = parseInt(searchParams.page) || 1;
            const limit = parseInt(searchParams.limit) || 10;
            const offset = (page - 1) * limit;
            query += ` LIMIT ? OFFSET ?`;
            queryParams.push(limit, offset);

            // Thực hiện query
            db.query(query, queryParams, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                // Query để đếm tổng số kết quả cho phân trang
                let countQuery = `
                    SELECT COUNT(DISTINCT c.id) as total
                    FROM courses c
                    WHERE c.is_public = 1
                `;

                if (searchParams.keyword) {
                    countQuery += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
                }
                if (searchParams.teacherId) {
                    countQuery += ` AND c.teacher_id = ?`;
                }

                db.query(countQuery, queryParams.slice(0, -2), (countError, countResults) => {
                    if (countError) {
                        reject(countError);
                        return;
                    }

                    resolve({
                        courses: results,
                        pagination: {
                            total: countResults[0].total,
                            page: page,
                            limit: limit,
                            totalPages: Math.ceil(countResults[0].total / limit)
                        }
                    });
                });
            });
        });
    },

}

module.exports = search;