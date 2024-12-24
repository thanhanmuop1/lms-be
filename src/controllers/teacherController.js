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

  createCourse: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const { title, description, thumbnail, is_public } = req.body;
      const course = await lms.createCourse({
        title,
        description,
        thumbnail,
        teacher_id: teacherId,
        is_public
      });
      res.status(201).json(course);
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateCourse: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const courseId = req.params.id;
      
      // Kiểm tra quyền sở hữu khóa học
      const course = await lms.getCourseById(courseId);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền chỉnh sửa khóa học này' });
      }

      const { title, description, thumbnail } = req.body;
      const updatedCourse = await lms.updateCourse(courseId, {
        title,
        description,
        thumbnail,
        is_public: course.is_public // Giữ nguyên trạng thái public/private
      });
      res.json(updatedCourse);
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteCourse: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const courseId = req.params.id;
      
      // Kiểm tra quyền sở hữu khóa học
      const course = await lms.getCourseById(courseId);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền xóa khóa học này' });
      }

      // Xóa documents trước
      await lms.deleteDocumentsByCourseId(courseId);
      // Sau đó xóa videos
      await lms.deleteVideosByCourseId(courseId);
      // Tiếp theo xóa chapters
      await lms.deleteChaptersByCourseId(courseId);
      // Cuối cùng xóa course
      await lms.deleteCourse(courseId);
      
      res.json({ message: 'Xóa khóa học thành công' });
    } catch (error) {
      console.error('Error deleting course:', error);
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

  addVideo: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const courseId = req.params.courseId;
      
      // Kiểm tra quyền sở hữu khóa học
      const course = await lms.getCourseById(courseId);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền thêm video vào khóa học này' });
      }

      const { title, video_url, chapter_id } = req.body;
      const video = await lms.createVideo({
        title,
        video_url,
        chapter_id,
        course_id: courseId
      });
      res.status(201).json(video);
    } catch (error) {
      console.error('Error adding video:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateVideo: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const videoId = req.params.id;
      
      // Kiểm tra quyền sở hữu video thông qua khóa học
      const video = await lms.getVideoById(videoId);
      const course = await lms.getCourseById(video.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền chỉnh sửa video này' });
      }

      const { title, description, url } = req.body;
      const updatedVideo = await lms.updateVideo(videoId, {
        title,
        description,
        url
      });
      res.json(updatedVideo);
    } catch (error) {
      console.error('Error updating video:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteVideo: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const videoId = req.params.id;
      
      // Kiểm tra quyền sở hữu video thông qua khóa học
      const video = await lms.getVideoById(videoId);
      const course = await lms.getCourseById(video.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền xóa video này' });
      }

      await lms.deleteVideo(videoId);
      res.json({ message: 'Xóa video thành công' });
    } catch (error) {
      console.error('Error deleting video:', error);
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

  addDocument: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const courseId = req.params.courseId;
      
      // Kiểm tra quyền sở hữu khóa học
      const course = await lms.getCourseById(courseId);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền thêm tài liệu vào khóa học này' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Không có file được upload' });
      }

      const { chapterId, videoId } = req.body;
      const documentData = {
        title: req.body.title || req.file.originalname,
        file_path: req.file.path,
        file_type: path.extname(req.file.originalname).substring(1),
        course_id: courseId,
        chapter_id: chapterId || null,
        video_id: videoId || null,
        teacher_id: teacherId
      };

      const document = await lms.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error('Error adding document:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Chapter Management
  createChapter: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const courseId = req.params.courseId;
      
      // Kiểm tra quyền sở hữu khóa học
      const course = await lms.getCourseById(courseId);
      if (!course || (course.teacher_id !== teacherId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Không có quyền thêm chương vào khóa học này' });
      }

      const { title } = req.body;
      const chapter = await lms.createChapter(courseId, title);
      res.status(201).json(chapter);
    } catch (error) {
      console.error('Error creating chapter:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateChapter: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const chapterId = req.params.id;
      
      // Lấy thông tin chapter
      const chapter = await lms.getChapterById(chapterId);
      if (!chapter) {
        return res.status(404).json({ message: 'Không tìm thấy chương' });
      }
      
      // Kiểm tra quyền sở hữu thông qua khóa học
      const course = await lms.getCourseById(chapter.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền chỉnh sửa chương này' });
      }

      const { title } = req.body;
      const updatedChapter = await lms.updateChapter(chapterId, title);
      res.json(updatedChapter);
    } catch (error) {
      console.error('Error updating chapter:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteChapter: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const chapterId = req.params.id;
      
      // Kiểm tra quyền sở hữu chapter thông qua khóa học
      const chapter = await lms.getChapterById(chapterId);
      const course = await lms.getCourseById(chapter.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền xóa chương này' });
      }

      await lms.deleteVideosByChapterId(chapterId);
      await lms.deleteChapter(chapterId);
      res.json({ message: 'Xóa chương thành công' });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Quiz Management
  createQuiz: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const { title, duration_minutes, passing_score } = req.body;

      const result = await quiz.createQuiz({
        title,
        duration_minutes,
        passing_score,
        teacher_id: teacherId
      });

      res.status(201).json({ 
        message: 'Tạo quiz thành công',
        quizId: result.insertId 
      });
    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateQuiz: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const quizId = req.params.id;
      
      // Kiểm tra quyền sở hữu quiz
      const quizInfo = await quiz.getQuizById(quizId);
      if (!quizInfo) {
        return res.status(404).json({ message: 'Không tìm thấy quiz' });
      }

      // Chỉ kiểm tra course_id nếu quiz đã được gán cho khóa học
      if (quizInfo.course_id) {
        const course = await lms.getCourseById(quizInfo.course_id);
        if (!course || course.teacher_id !== teacherId) {
          return res.status(403).json({ message: 'Không có quyền chỉnh sửa quiz này' });
        }
      }

      const { title, duration_minutes, passing_score, points_per_question } = req.body;
      const updatedQuiz = await quiz.updateQuiz(quizId, {
        title,
        duration_minutes,
        passing_score,
        points_per_question
      });
      res.json(updatedQuiz);
    } catch (error) {
      console.error('Error updating quiz:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Question Management
  addQuestion: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const quizId = req.params.quizId;
      
      // Kiểm tra quyền sở hữu quiz thông qua khóa học
      const quiz = await lms.getQuizById(quizId);
      const course = await lms.getCourseById(quiz.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền thêm câu hỏi vào quiz này' });
      }

      const { content, options, correct_answer, score } = req.body;
      const question = await lms.createQuestion({
        quiz_id: quizId,
        content,
        options,
        correct_answer,
        score
      });
      res.status(201).json(question);
    } catch (error) {
      console.error('Error adding question:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateQuestion: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const questionId = req.params.id;
      
      // Kiểm tra quyền sở hữu question thông qua quiz và khóa học
      const question = await lms.getQuestionById(questionId);
      const quiz = await lms.getQuizById(question.quiz_id);
      const course = await lms.getCourseById(quiz.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền chỉnh sửa câu hỏi này' });
      }

      const { content, options, correct_answer, score } = req.body;
      const updatedQuestion = await lms.updateQuestion(questionId, {
        content,
        options,
        correct_answer,
        score
      });
      res.json(updatedQuestion);
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Quiz Management
  deleteQuiz: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const quizId = req.params.id;
      
      // Kiểm tra quyền sở hữu quiz
      const quizInfo = await quiz.getQuizById(quizId);
      if (!quizInfo) {
        return res.status(404).json({ message: 'Không tìm thấy quiz' });
      }

      // Nếu quiz đã được gán cho khóa học, kiểm tra quyền sở hữu khóa học
      if (quizInfo.course_id) {
        const course = await lms.getCourseById(quizInfo.course_id);
        if (!course || course.teacher_id !== teacherId) {
          return res.status(403).json({ message: 'Không có quyền xóa quiz này' });
        }
      }

      // Kiểm tra xem quiz có thuộc về teacher này không
      if (quizInfo.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền xóa quiz này' });
      }

      await quiz.deleteQuiz(quizId);
      res.json({ message: 'Xóa quiz thành công' });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Document Management
  updateDocument: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const documentId = req.params.id;
      
      // Kiểm tra quyền sở hữu document thông qua khóa học
      const document = await lms.getDocumentById(documentId);
      const course = await lms.getCourseById(document.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền chỉnh sửa tài liệu này' });
      }

      const { title, description, url } = req.body;
      const updatedDocument = await lms.updateDocument(documentId, {
        title,
        description,
        url
      });
      res.json(updatedDocument);
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Chú ý sau này xoá
  deleteDocument: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const documentId = req.params.id;
      
      // Kiểm tra quyền sở hữu document thông qua khóa học
      const document = await lms.getDocumentById(documentId);
      const course = await lms.getCourseById(document.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền xóa tài liệu này' });
      }

      await lms.deleteDocument(documentId);
      res.json({ message: 'Xóa tài liệu thành công' });
    } catch (error) {
      console.error('Error deleting document:', error);
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

  deleteQuestion: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const questionId = req.params.id;
      
      // Kiểm tra quyền sở hữu question thông qua quiz và khóa học
      const question = await lms.getQuestionById(questionId);
      const quiz = await lms.getQuizById(question.quiz_id);
      const course = await lms.getCourseById(quiz.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền xóa câu hỏi này' });
      }

      await lms.deleteQuestion(questionId);
      res.json({ message: 'Xóa câu hỏi thành công' });
    } catch (error) {
      console.error('Error deleting question:', error);
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

  downloadDocument: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const documentId = req.params.id;

      // Lấy thông tin document
      const document = await lms.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
      }

      // Kiểm tra quyền truy cập thông qua khóa học
      const course = await lms.getCourseById(document.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền truy cập tài liệu này' });
      }

      // Kiểm tra file có tồn tại
      if (!fs.existsSync(document.file_path)) {
        return res.status(404).json({ message: 'File không tồn tại' });
      }

      // Lấy tên file gốc
      const originalFileName = path.basename(document.file_path);

      // Set headers cho download
      res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      // Stream file về client
      const fileStream = fs.createReadStream(document.file_path);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading document:', error);
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

  // Thêm câu hỏi mới
  addQuestions: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const quizId = req.params.quizId;
      
      // Kiểm tra quyền sở hữu quiz
      const quizInfo = await quiz.getQuizById(quizId);
      if (!quizInfo) {
        return res.status(404).json({ message: 'Không tìm thấy quiz' });
      }

      if (quizInfo.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền thêm câu hỏi vào quiz này' });
      }

      const { questions } = req.body;
      
      // Thêm từng câu hỏi và đáp án
      for (const questionData of questions) {
        const questionId = await quiz.addQuestionToQuiz(quizId, {
          question_text: questionData.question_text,
          points: questionData.points,
          allows_multiple_correct: questionData.allows_multiple_correct
        });

        if (questionData.options && questionData.options.length > 0) {
          await quiz.addOptionsToQuestion(questionId, questionData.options);
        }
      }

      res.status(201).json({ message: 'Thêm câu hỏi thành công' });
    } catch (error) {
      console.error('Error adding questions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateQuestions: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const quizId = req.params.quizId;
      
      // Kiểm tra quyền sở hữu quiz
      const quizInfo = await quiz.getQuizById(quizId);
      if (!quizInfo) {
        return res.status(404).json({ message: 'Không tìm thấy quiz' });
      }

      if (quizInfo.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền cập nhật câu hỏi của quiz này' });
      }

      const { questions } = req.body;
      
      // Cập nhật từng câu hỏi và đáp án
      for (const questionData of questions) {
        // Cập nhật thông tin câu hỏi
        await quiz.updateQuestion(questionData.id, {
          question_text: questionData.question_text,
          points: questionData.points,
          allows_multiple_correct: questionData.allows_multiple_correct
        });

        // Xóa các đáp án cũ
        await quiz.deleteQuestionOptions(questionData.id);

        // Thêm các đáp án mới
        if (questionData.options && questionData.options.length > 0) {
          await quiz.addOptionsToQuestion(questionData.id, questionData.options);
        }
      }

      res.json({ message: 'Cập nhật câu hỏi thành công' });
    } catch (error) {
      console.error('Error updating questions:', error);
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

  assignQuizToVideo: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const videoId = req.params.videoId;
      const { quiz_id } = req.body;

      // Kiểm tra quyền sở hữu video và quiz
      const video = await lms.getVideoById(videoId);
      const course = await lms.getCourseById(video.course_id);
      const quizInfo = await quiz.getQuizById(quiz_id);

      if (!course || course.teacher_id !== teacherId || quizInfo.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền thực hiện' });
      }

      await quiz.assignQuizToVideo(quiz_id, videoId);
      res.json({ message: 'Gán quiz thành công' });
    } catch (error) {
      console.error('Error assigning quiz:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  unassignQuizFromVideo: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const { videoId, quizId } = req.params;

      // Kiểm tra quyền sở hữu
      const video = await lms.getVideoById(videoId);
      const course = await lms.getCourseById(video.course_id);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Không có quyền thực hiện' });
      }

      await quiz.unassignQuizFromVideo(quizId, videoId);
      res.json({ message: 'Hủy gán quiz thành công' });
    } catch (error) {
      console.error('Error unassigning quiz:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};

module.exports = teacherController; 