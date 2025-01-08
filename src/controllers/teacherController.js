const lms = require('../models/lms');
const quiz = require('../models/quiz');
const path = require('path');
const fs = require('fs');

const teacherController = {
  // Course Management
  getTeacherCourses: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const courses = await lms.getTeacherCourses(teacherId);
      res.json(courses);
    } catch (error) {
      console.error('Error getting teacher courses:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Video Management
  getCourseVideos: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const courseId = req.params.courseId;
      
      // Kiểm tra quyền sở hữu khóa học
      const course = await lms.getCourseById(courseId);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền truy cập khóa học này' });
      }

      const videos = await lms.getVideosByCourseId(courseId);
      res.json(videos);
    } catch (error) {
      console.error('Error getting course videos:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Quiz Management
  getCourseQuizzes: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const courseId = req.params.courseId;
      
      // Kiểm tra quyền sở hữu khóa học
      const course = await lms.getCourseById(courseId);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền truy cập khóa học này' });
      }

      const quizzes = await lms.getQuizzesByCourseId(courseId);
      res.json(quizzes);
    } catch (error) {
      console.error('Error getting course quizzes:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Document Management methods tương tự như Video Management
  getCourseDocuments: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const courseId = req.params.courseId;
      
      const course = await lms.getCourseById(courseId);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền truy cập khóa học này' });
      }

      const documents = await lms.getDocumentsByCourseId(courseId);
      res.json(documents);
    } catch (error) {
      console.error('Error getting course documents:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Chapter Management
  getCourseChapters: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const courseId = req.params.courseId;
      
      // Kiểm tra quyền sở hữu khóa học
      const course = await lms.getCourseById(courseId);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền truy cập khóa học này' });
      }

      const chapters = await lms.getChaptersByCourseId(courseId);
      res.json(chapters);
    } catch (error) {
      console.error('Error getting course chapters:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Question Management
  getQuizQuestions: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const quizId = req.params.quizId;
      
      // Kiểm tra quyền sở hữu quiz thông qua khóa học
      const quiz = await lms.getQuizById(quizId);
      const course = await lms.getCourseById(quiz.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền truy cập quiz này' });
      }

      const questions = await lms.getQuestionsByQuizId(quizId);
      res.json(questions);
    } catch (error) {
      console.error('Error getting quiz questions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getCourseById: async (req, res) => {
    try {
        const teacherId = req.user.id;
        const courseId = req.params.id;
        
        // Lấy thông tin khóa học
        const course = await lms.getCourseById(courseId);
        
        // Kiểm tra xem khóa học có tồn tại không
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }
        
        // Kiểm tra quyền sở hữu khóa học
        if (course.teacher_id !== teacherId) {
            return res.status(403).json({ message: 'Không có quyền truy cập khóa học này' });
        }

        // Lấy thêm thông tin chapters và videos của khóa học
        const chapters = await lms.getChaptersByCourseId(courseId);
        const videos = await lms.getVideosByCourseId(courseId);
        const documents = await lms.getDocumentsByCourseId(courseId);
        const quizzes = await lms.getQuizzesByCourseId(courseId);

        // Trả về đầy đủ thông tin khóa học
        res.json({
            ...course,
            chapters,
            videos,
            documents,
            quizzes
        });
    } catch (error) {
        console.error('Error getting course details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAllTeacherQuizzes: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const quizzes = await quiz.getQuizzesByTeacher(teacherId);
      res.json(quizzes);
    } catch (error) {
      console.error('Error getting teacher quizzes:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getQuizById: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const quizId = req.params.id;
      
      // Lấy thông tin quiz từ quiz model
      const quizInfo = await quiz.getQuizById(quizId);
      if (!quizInfo) {
        return res.status(404).json({ message: 'Không tìm thấy quiz' });
      }
      
      // Kiểm tra quyền sở hữu quiz
      if (quizInfo.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền truy cập quiz này' });
      }

      res.json(quizInfo);
    } catch (error) {
      console.error('Error getting quiz:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAvailableQuizzesForVideo: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const videoId = req.params.videoId;
      
      // Kiểm tra quyền sở hữu video
      const video = await lms.getVideoById(videoId);
      const course = await lms.getCourseById(video.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền truy cập video này' });
      }

      // Lấy danh sách quiz của giáo viên chưa được gán cho video này
      const availableQuizzes = await quiz.getAvailableQuizzesForVideo(videoId, teacherId);
      res.json(availableQuizzes);
    } catch (error) {
      console.error('Error getting available quizzes:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};

module.exports = teacherController; 