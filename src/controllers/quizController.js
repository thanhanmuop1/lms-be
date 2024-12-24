const quiz = require('../models/quiz');

const quizController = {
    getQuizzesByCourse: async (req, res) => {
        try {
            const courseId = req.params.courseId;
            const quizzes = await quiz.getQuizzesByCourse(courseId);
            res.json(quizzes);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getQuizzesByChapter: async (req, res) => {
        try {
            const chapterId = req.params.chapterId;
            const quizzes = await quiz.getQuizzesByChapter(chapterId);
            res.json(quizzes);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    submitQuiz: async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: 'Unauthorized - Please login' });
            }

            const quizId = req.params.quizId;
            const userId = req.user.id;
            const { answers } = req.body;
            
            if (!answers || Object.keys(answers).length === 0) {
                return res.status(400).json({ message: 'No answers provided' });
            }

            // Tính điểm và kiểm tra kết quả
            const quizResult = await quiz.submitQuizAttempt(userId, quizId, answers);

            // Lưu attempt
            const attemptResult = await quiz.saveQuizAttempt({
                userId,
                quizId,
                score: quizResult.score,
                status: quizResult.status
            });

            // Lưu answers
            await quiz.saveQuizAnswers(attemptResult.insertId, answers);

            res.json(quizResult);
        } catch (error) {
            console.error('Error submitting quiz:', error);
            res.status(500).json({ 
                message: 'Internal server error',
                error: error.message 
            });
        }
    },

    getQuizResult: async (req, res) => {
        try {
            const userId = req.user.id;
            const quizId = req.params.quizId;
            
            // Lấy kết quả quiz
            const result = await quiz.getQuizResult(userId, quizId);
            
            if (!result) {
                return res.json(null);
            }

            res.json(result);
        } catch (error) {
            console.error('Error getting quiz result:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    createQuiz: async (req, res) => {
        try {
            // Kiểm tra quyền admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Không có quyền thực hiện' });
            }

            const {
                title,
                course_id,
                chapter_id,
                video_id,
                duration_minutes,
                passing_score,
                quiz_type,
                questions
            } = req.body;

            // Tạo quiz
            const quizId = await quiz.createQuiz({
                title,
                course_id,
                chapter_id,
                video_id,
                duration_minutes,
                passing_score,
                quiz_type
            });

            // Thêm các câu hỏi và đáp án
            if (questions && questions.length > 0) {
                for (const questionData of questions) {
                    const questionId = await quiz.addQuestionToQuiz(quizId, {
                        question_text: questionData.question_text,
                        points: questionData.points
                    });

                    if (questionData.options && questionData.options.length > 0) {
                        await quiz.addOptionsToQuestion(questionId, questionData.options);
                    }
                }
            }

            res.status(201).json({ 
                message: 'Quiz created successfully',
                quizId: quizId
            });
        } catch (error) {
            console.error('Error creating quiz:', error);
            res.status(500).json({ 
                message: 'Internal server error',
                error: error.message 
            });
        }
    },

    deleteQuiz: async (req, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Không có quyền thực hiện' });
            }

            const quizId = req.params.quizId;
            await quiz.deleteQuiz(quizId);
            
            res.json({ message: 'Quiz deleted successfully' });
        } catch (error) {
            console.error('Error deleting quiz:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getUnassignedQuizzes: async (req, res) => {
        try {
            const quizzes = await quiz.getUnassignedQuizzes();
            res.json(quizzes);
        } catch (error) {
            console.error('Error getting unassigned quizzes:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    assignQuiz: async (req, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Không có quyền thực hiện' });
            }

            const quizId = req.params.quizId;
            const { video_id, chapter_id } = req.body;

            if (!video_id && !chapter_id) {
                return res.status(400).json({ 
                    message: 'Phải chỉ định video hoặc chương để gán quiz' 
                });
            }

            await quiz.assignQuiz(quizId, { video_id, chapter_id });
            res.json({ message: 'Quiz assigned successfully' });
        } catch (error) {
            console.error('Error assigning quiz:', error);
            if (error.message.includes('không tìm thấy') || 
                error.message.includes('không tồn tại') ||
                error.message.includes('không phù hợp')) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ 
                    message: 'Có lỗi xảy ra khi gán quiz',
                    error: error.message 
                });
            }
        }
    },

    getAllQuizzes: async (req, res) => {
        try {
            const quizzes = await quiz.getAllQuizzes();
            res.json(quizzes);
        } catch (error) {
            console.error('Error fetching all quizzes:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getQuizzesForVideo: async (req, res) => {
        try {
            const videoId = req.params.videoId;
            let quizzes;

            // Nếu là admin, lấy tất cả quiz
            if (req.user.role === 'admin') {
                quizzes = await quiz.getAllQuizzes();
                // Format lại response để thêm trạng thái is_assigned
                quizzes = quizzes.map(q => ({
                    ...q,
                    is_assigned: q.video_id === parseInt(videoId),
                    question_count: q.question_count || 0
                }));
            } else {
                // Nếu là teacher, chỉ lấy quiz của teacher đó
                quizzes = await quiz.getAvailableQuizzesForVideo(videoId, req.user.id);
            }

            res.json(quizzes);
        } catch (error) {
            console.error('Error getting quizzes for video:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    unassignQuiz: async (req, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Không có quyền thực hiện' });
            }

            const quizId = req.params.quizId;
            await quiz.unassignQuiz(quizId);
            res.json({ message: 'Quiz unassigned successfully' });
        } catch (error) {
            console.error('Error unassigning quiz:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getQuizById: async (req, res) => {
        try {
            const quizId = req.params.quizId;
            const quizData = await quiz.getQuizById(quizId);
            
            if (!quizData) {
                return res.status(404).json({ message: 'Quiz không tồn tại' });
            }

            res.json(quizData);
        } catch (error) {
            console.error('Error getting quiz:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    resetQuizAttempt: async (req, res) => {
        try {
            const userId = req.user.id;
            const quizId = req.params.quizId;
            
            await quiz.resetQuizAttempt(userId, quizId);
            res.json({ message: 'Quiz attempt reset successfully' });
        } catch (error) {
            console.error('Error resetting quiz attempt:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    updateQuiz: async (req, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Không có quyền thực hiện' });
            }

            const quizId = req.params.quizId;
            const {
                title,
                duration_minutes,
                passing_score
            } = req.body;

            await quiz.updateQuiz(quizId, {
                title,
                duration_minutes,
                passing_score
            });

            res.json({ message: 'Quiz updated successfully' });
        } catch (error) {
            console.error('Error updating quiz:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    updateQuizQuestions: async (req, res) => {
        try {
            if (!['admin', 'teacher'].includes(req.user.role)) {
                return res.status(403).json({ message: 'Không có quyền thực hiện' });
            }

            const { quizId } = req.params;
            const { questions } = req.body;

            // Xóa câu hỏi và đáp án cũ
            await quiz.deleteQuizQuestions(quizId);

            // Thêm câu hỏi và đáp án mới
            if (questions && questions.length > 0) {
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
            }

            res.json({ message: 'Cập nhật câu hỏi thành công' });
        } catch (error) {
            console.error('Error updating quiz questions:', error);
            res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật câu hỏi' });
        }
    }
};

module.exports = quizController; 