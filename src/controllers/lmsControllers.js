const lms = require('../models/lms');

const getAllCourses = async (req, res) => {
    try {
        const courses = await lms.getAllCourses();
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error getting courses:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllVideos = async (req, res) => {
    try {
        const videos = await lms.getAllVideos();
        res.status(200).json(videos);
    } catch (error) {
        console.error('Error getting videos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getVideosByCourseId = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const videos = await lms.getVideosByCourseId(courseId);
        res.status(200).json(videos);
    } catch (error) {
        console.error('Error getting videos for course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getVideoById = async (req, res) => {
    try {
        const videoId = req.params.videoId;
        const video = await lms.getVideoById(videoId);
        
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        
        res.status(200).json(video);
    } catch (error) {
        console.error('Error getting video:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getChaptersByCourseId = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const chapters = await lms.getChaptersByCourseId(courseId);
        res.status(200).json(chapters);
    } catch (error) {
        console.error('Error getting chapters:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getVideosByChapterId = async (req, res) => {
    try {
        const chapterId = req.params.chapterId;
        const videos = await lms.getVideosByChapterId(chapterId);
        res.status(200).json(videos);
    } catch (error) {
        console.error('Error getting videos for chapter:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createCourse = async (req, res) => {
    try {
        // Cho phép cả admin và teacher tạo khóa học
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Không có quyền thực hiện' });
        }

        const { title, description, thumbnail, is_public } = req.body;
        const teacher_id = req.user.id; // Lấy ID của người tạo
        
        const course = await lms.createCourse({ 
            title, 
            description, 
            thumbnail,
            is_public,
            teacher_id
        });
        
        res.status(201).json(course);
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        
        // Kiểm tra quyền xóa
        const course = await lms.getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }

        if (req.user.role !== 'admin' && 
            (req.user.role === 'teacher' && course.teacher_id !== req.user.id)) {
            return res.status(403).json({ message: 'Không có quyền thực hiện' });
        }

        // Xóa tất cả documents của khóa học trước
        await lms.deleteDocumentsByCourseId(courseId);
        
        // Xóa tất cả videos của khóa học
        await lms.deleteVideosByCourseId(courseId);
        
        // Xóa tất cả chapters của khóa học
        await lms.deleteChaptersByCourseId(courseId);
        
        // Cuối cùng xóa khóa học
        await lms.deleteCourse(courseId);
        
        res.status(200).json({ message: 'Xóa khóa học thành công' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        
        // Kiểm tra khóa học có tồn tại không
        const course = await lms.getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }

        // Kiểm tra quyền - admin có thể sửa tất cả, giáo viên chỉ sửa được khóa học của mình
        if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền chỉnh sửa khóa học này' });
        }

        const { title, description, thumbnail, is_public } = req.body;

        const updatedCourse = await lms.updateCourse(courseId, { 
            title, 
            description, 
            thumbnail,
            is_public: typeof is_public === 'boolean' ? is_public : course.is_public // Chỉ cập nhật nếu có gửi lên
        });
        
        res.status(200).json(updatedCourse);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await lms.getCourseById(courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }
        
        res.status(200).json(course);
    } catch (error) {
        console.error('Error getting course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createChapter = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền thực hiện' });
        }

        const courseId = req.params.courseId;
        const { title } = req.body;
        
        const result = await lms.createChapter(courseId, title);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating chapter:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateChapter = async (req, res) => {
    try {
        // Kiểm tra quyền cập nhật
        const chapterId = req.params.chapterId;
        const chapter = await lms.getChapterById(chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Không tìm thấy chương' });
        }

        // Cho phép admin hoặc teacher sở hữu khóa học
        if (req.user.role === 'admin') {
            const { title } = req.body;
            const updatedChapter = await lms.updateChapter(chapterId, title);
            return res.json(updatedChapter);
        }

        // Nếu là teacher, kiểm tra quyền sở hữu
        const course = await lms.getCourseById(chapter.course_id);
        if (course.teacher_id !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền chỉnh sửa chương này' });
        }

        const { title } = req.body;
        const updatedChapter = await lms.updateChapter(chapterId, title);
        res.json(updatedChapter);
    } catch (error) {
        console.error('Error updating chapter:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteChapter = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền thực hiện' });
        }

        const chapterId = req.params.chapterId;

        // Xóa tất cả video trong chương
        await lms.deleteVideosByChapterId(chapterId);
        // Xóa chương
        await lms.deleteChapter(chapterId);
        
        res.status(200).json({ message: 'Xóa chương thành công' });
    } catch (error) {
        console.error('Error deleting chapter:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createVideo = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền thực hiện' });
        }

        const chapterId = req.params.chapterId;
        const { title, video_url, course_id } = req.body;
        
        // Log để debug
        console.log('Received video data:', { chapterId, title, video_url, course_id });
        
        // Validate required fields
        if (!title || !video_url || !chapterId || !course_id) {
            return res.status(400).json({ 
                message: 'Thiếu thông tin bắt buộc',
                required: {
                    title: !title,
                    video_url: !video_url,
                    chapter_id: !chapterId,
                    course_id: !course_id
                }
            });
        }
        
        const result = await lms.createVideo(chapterId, course_id, title, video_url);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating video:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

const updateVideo = async (req, res) => {
    try {
        const videoId = req.params.videoId;
        const { title, video_url } = req.body;

        // Kiểm tra video có tồn tại không
        const video = await lms.getVideoById(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Không tìm thấy video' });
        }

        // Kiểm tra quyền - admin có thể sửa tất cả, giáo viên chỉ sửa được video trong khóa học của mình
        const course = await lms.getCourseById(video.course_id);
        if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền chỉnh sửa video này' });
        }
        
        await lms.updateVideo(videoId, title, video_url);
        res.status(200).json({ message: 'Cập nhật video thành công' });
    } catch (error) {
        console.error('Error updating video:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteVideo = async (req, res) => {
    try {
        const videoId = req.params.videoId;
        
        // Kiểm tra video có tồn tại không
        const video = await lms.getVideoById(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Không tìm thấy video' });
        }

        // Kiểm tra quyền - admin có thể xóa tất cả, giáo viên chỉ xóa được video trong khóa học của mình
        const course = await lms.getCourseById(video.course_id);
        if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền xóa video này' });
        }

        // Xóa theo thứ tự để tránh lỗi khóa ngoại
        await lms.deleteVideoProgress(videoId);  // Xóa video progress trước
        await lms.deleteDocumentsByVideoId(videoId);  // Xóa documents
        await lms.deleteVideo(videoId);  // Cuối cùng xóa video
        
        res.status(200).json({ message: 'Xóa video thành công' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const markVideoAsWatched = async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.id;

        // Check if the record already exists
        const existingRecord = await lms.getVideoCompletion(userId, videoId);
        if (existingRecord) {
            return res.status(200).json({ message: 'Video already marked as watched' });
        }

        // Mark video as watched
        await lms.markVideoAsWatched(userId, videoId);
        res.status(200).json({ message: 'Video marked as watched' });
    } catch (error) {
        console.error('Error marking video as watched:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getCompletedVideos = async (req, res) => {
    try {
        const userId = req.user.id;
        const completedVideos = await lms.getCompletedVideos(userId);
        res.status(200).json(completedVideos);
    } catch (error) {
        console.error('Error getting completed videos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file được upload' });
    }

    // Trả về đường dẫn file
    const thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/thumbnails/${req.file.filename}`;
    res.status(200).json({ url: thumbnailUrl });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCourseVisibility = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { isPublic } = req.body;

        // Kiểm tra khóa học có tồn tại không
        const course = await lms.getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }

        // Kiểm tra quyền - admin có thể sửa tất cả, giáo viên chỉ sửa được khóa học của mình
        if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
            return res.status(403).json({ 
                message: 'Không có quyền thay đổi trạng thái khóa học này' 
            });
        }

        await lms.updateCourseVisibility(courseId, isPublic);
        res.json({ 
            message: `Khóa học đã được ${isPublic ? 'public' : 'private'}` 
        });
    } catch (error) {
        console.error('Error updating course visibility:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getCourseVisibility = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const isPublic = await lms.getCourseVisibility(courseId);
        res.json({ isPublic });
    } catch (error) {
        console.error('Error fetching course visibility:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getStudentsByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Kiểm tra khóa học tồn tại
    const course = await lms.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Kiểm tra quyền truy cập (chỉ admin và giáo viên của khóa học)
    if (req.user.role !== 'admin' && 
        (req.user.role === 'teacher' && course.teacher_id !== req.user.id)) {
      return res.status(403).json({ 
        message: 'Không có quyền xem danh sách học sinh của khóa học này' 
      });
    }

    const students = await lms.getStudentsByCourseId(courseId);
    res.json(students);
  } catch (error) {
    console.error('Error getting students by course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeStudentFromCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.params.userId;

        // Kiểm tra khóa học tồn tại
        const course = await lms.getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }

        // Kiểm tra quyền truy cập (chỉ admin và giáo viên của khóa học)
        if (req.user.role !== 'admin' && 
            (req.user.role === 'teacher' && course.teacher_id !== req.user.id)) {
            return res.status(403).json({ 
                message: 'Không có quyền xóa học viên khỏi khóa học này' 
            });
        }
        
        // Sau đó xóa khỏi khóa học
        await lms.deleteStudentFromCourse(courseId, userId);
        
        res.status(200).json({ 
            message: 'Đã xóa học viên khỏi khóa học thành công' 
        });
    } catch (error) {
        console.error('Error removing student from course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { 
    getAllCourses,
    getAllVideos,
    getVideosByCourseId,
    getVideoById,
    getChaptersByCourseId,
    getVideosByChapterId,
    createCourse,
    deleteCourse,
    updateCourse,
    getCourseById,
    createChapter,
    updateChapter,
    deleteChapter,
    createVideo,
    updateVideo,
    deleteVideo,
    markVideoAsWatched,
    getCompletedVideos,
    uploadThumbnail,
    updateCourseVisibility,
    getCourseVisibility,
    getStudentsByCourse,
    removeStudentFromCourse
};

