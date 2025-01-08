const classModel = require('../models/classModel');

const classController = {
    // Lấy danh sách tất cả lớp học của giáo viên
    getTeacherClasses: async (req, res) => {
        try {
            const teacherId = req.user.id;
            const classes = await classModel.getTeacherClasses(teacherId);
            
            res.json({
                success: true,
                data: classes
            });
        } catch (error) {
            console.error('Error getting teacher classes:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy danh sách lớp học'
            });
        }
    },

    // Lấy chi tiết một lớp học
    getClassDetail: async (req, res) => {
        try {
            const { classId } = req.params;
            const teacherId = req.user.id;

            const classDetails = await classModel.getClassById(classId, teacherId);

            if (!classDetails) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lớp học hoặc bạn không có quyền truy cập'
                });
            }

            const [students, courses] = await Promise.all([
                classModel.getClassStudents(classId),
                classModel.getClassCourses(classId)
            ]);

            res.json({
                success: true,
                data: {
                    ...classDetails,
                    students,
                    courses
                }
            });
        } catch (error) {
            console.error('Error getting class detail:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy thông tin chi tiết lớp học'
            });
        }
    },

    // Tạo lớp học mới
    createClass: async (req, res) => {
        try {
            const teacherId = req.user.id;
            const { name, description, max_students, requires_password, password } = req.body;

            const classData = {
                name,
                description,
                teacher_id: teacherId,
                max_students: max_students || 100,
                requires_password,
                password: requires_password ? password : null,
                class_code: Math.random().toString(36).substring(2, 8).toUpperCase() // Tạo mã lớp ngẫu nhiên
            };

            const newClass = await classModel.createClass(classData);
            res.status(201).json({
                success: true,
                message: 'Tạo lớp học thành công',
                data: newClass
            });
        } catch (error) {
            console.error('Error creating class:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi tạo lớp học'
            });
        }
    },

    // Cập nhật thông tin lớp học
    updateClass: async (req, res) => {
        try {
            const { classId } = req.params;
            const teacherId = req.user.id;
            const { name, description, max_students, requires_password, password, status, thumbnail } = req.body;

            const classData = {
                name,
                description,
                max_students,
                requires_password,
                password: requires_password ? password : null,
                status,
                thumbnail
            };

            const updatedClass = await classModel.updateClass(classId, teacherId, classData);
            if (!updatedClass) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lớp học hoặc bạn không có quyền truy cập'
                });
            }

            res.json({
                success: true,
                message: 'Cập nhật lớp học thành công',
                data: updatedClass
            });
        } catch (error) {
            console.error('Error updating class:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi cập nhật lớp học'
            });
        }
    },

    // Xóa lớp học
    deleteClass: async (req, res) => {
        try {
            const { classId } = req.params;
            const teacherId = req.user.id;

            const result = await classModel.deleteClass(classId, teacherId);
            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lớp học hoặc bạn không có quyền truy cập'
                });
            }

            res.json({
                success: true,
                message: 'Xóa lớp học thành công'
            });
        } catch (error) {
            console.error('Error deleting class:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi xóa lớp học'
            });
        }
    },

    // Thêm khóa học vào lớp
    addCourseToClass: async (req, res) => {
        try {
            const { classId } = req.params;
            const { courseId } = req.body;
            const teacherId = req.user.id;

            const result = await classModel.addCourseToClass(classId, courseId, teacherId);
            res.json({
                success: true,
                message: 'Thêm khóa học vào lớp thành công',
                data: result
            });
        } catch (error) {
            console.error('Error adding course to class:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi thêm khóa học vào lớp'
            });
        }
    },

    // Xóa khóa học khỏi lớp
    removeCourseFromClass: async (req, res) => {
        try {
            const { classId, courseId } = req.params;
            const teacherId = req.user.id;

            await classModel.removeCourseFromClass(classId, courseId, teacherId);
            res.json({
                success: true,
                message: 'Xóa khóa học khỏi lớp thành công'
            });
        } catch (error) {
            console.error('Error removing course from class:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi xóa khóa học khỏi lớp'
            });
        }
    },

    // Lấy danh sách khóa học của lớp
    getClassCourses: async (req, res) => {
        try {
            const { classId } = req.params;
            const courses = await classModel.getClassCourses(classId);
            
            res.json({
                success: true,
                data: courses
            });
        } catch (error) {
            console.error('Error in getClassCourses:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể lấy danh sách khóa học'
            });
        }
    },

    // Lấy danh sách lớp học đã tham gia của học viên
    getEnrolledClasses: async (req, res) => {
        try {
            const studentId = req.user.id;
            const classes = await classModel.getEnrolledClasses(studentId);
            
            res.json({
                success: true,
                data: classes
            });
        } catch (error) {
            console.error('Error getting enrolled classes:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể lấy danh sách lớp học đã tham gia'
            });
        }
    },

    // Tham gia lớp học mới
    joinClass: async (req, res) => {
        try {
            const studentId = req.user.id;
            const { classCode, password } = req.body;

            // Kiểm tra lớp học tồn tại
            const classInfo = await classModel.getClassByCode(classCode);
            if (!classInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lớp học với mã này'
                });
            }

            // Kiểm tra mật khẩu nếu lớp yêu cầu
            if (classInfo.requires_password && classInfo.password !== password) {
                return res.status(401).json({
                    success: false,
                    message: 'Mật khẩu không chính xác'
                });
            }

            // Kiểm tra số lượng học viên
            const studentCount = await classModel.getClassStudentCount(classInfo.id);
            if (studentCount >= classInfo.max_students) {
                return res.status(400).json({
                    success: false,
                    message: 'Lớp học đã đạt số lượng học viên tối đa'
                });
            }

            // Kiểm tra học viên đã tham gia chưa
            const isEnrolled = await classModel.isStudentEnrolled(classInfo.id, studentId);
            if (isEnrolled) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã tham gia lớp học này'
                });
            }

            // Thêm học viên vào lớp
            await classModel.addStudentToClass(classInfo.id, studentId);

            res.json({
                success: true,
                message: 'Tham gia lớp học thành công'
            });
        } catch (error) {
            console.error('Error joining class:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể tham gia lớp học'
            });
        }
    },

    // Rời khỏi lớp học
    leaveClass: async (req, res) => {
        try {
            const studentId = req.user.id;
            const { classId } = req.params;

            // Kiểm tra học viên có trong lớp không
            const isEnrolled = await classModel.isStudentEnrolled(classId, studentId);
            if (!isEnrolled) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn không phải thành viên của lớp học này'
                });
            }

            // Xóa học viên khỏi lớp
            await classModel.removeStudentFromClass(classId, studentId);

            res.json({
                success: true,
                message: 'Đã rời khỏi lớp học'
            });
        } catch (error) {
            console.error('Error leaving class:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể rời khỏi lớp học'
            });
        }
    },

    // Upload thumbnail cho lớp học
    uploadThumbnail: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Không có file được upload'
                });
            }

            const thumbnailUrl = `/uploads/class-thumbnails/${req.file.filename}`;
            
            res.json({
                success: true,
                message: 'Upload thumbnail thành công',
                url: thumbnailUrl
            });
        } catch (error) {
            console.error('Error uploading thumbnail:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi upload thumbnail'
            });
        }
    },

    // Lấy danh sách khóa học của một lớp học (cho học sinh)
    getClassCoursesByStudent: async (req, res) => {
        try {
            const studentId = req.user.id;
            const { classId } = req.params;

            // Kiểm tra học sinh có trong lớp không
            const isEnrolled = await classModel.isStudentEnrolled(classId, studentId);
            if (!isEnrolled) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không phải thành viên của lớp học này'
                });
            }

            // Lấy danh sách khóa học
            const courses = await classModel.getClassCoursesByStudent(classId, studentId);
            
            res.json({
                success: true,
                data: courses
            });
        } catch (error) {
            console.error('Error getting class courses:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể lấy danh sách khóa học'
            });
        }
    }
};

module.exports = classController; 