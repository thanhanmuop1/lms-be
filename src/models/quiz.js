const db = require('../configs/database');

const quiz = {
    getQuizzesByChapter: (chapterId) => {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT q.*, qq.id as question_id, qq.question_text, 
                 qo.id as option_id, qo.option_text
                 FROM quizzes q
                 LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
                 LEFT JOIN quiz_options qo ON qq.id = qo.question_id
                 WHERE q.chapter_id = ?
                 ORDER BY q.id, qq.id, qo.id`,
                [chapterId],
                (error, results) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    
                    // Restructure data
                    const quizzes = {};
                    results.forEach(row => {
                        if (!quizzes[row.id]) {
                            quizzes[row.id] = {
                                id: row.id,
                                title: row.title,
                                duration_minutes: row.duration_minutes,
                                passing_score: row.passing_score,
                                questions: {}
                            };
                        }
                        
                        if (row.question_id && !quizzes[row.id].questions[row.question_id]) {
                            quizzes[row.id].questions[row.question_id] = {
                                id: row.question_id,
                                question_text: row.question_text,
                                options: []
                            };
                        }
                        
                        if (row.option_id) {
                            quizzes[row.id].questions[row.question_id].options.push({
                                id: row.option_id,
                                option_text: row.option_text
                            });
                        }
                    });
                    
                    // Convert to array
                    const quizzesArray = Object.values(quizzes).map(quiz => ({
                        ...quiz,
                        questions: Object.values(quiz.questions)
                    }));
                    
                    resolve(quizzesArray);
                }
            );
        });
    },

    getQuizzesByCourse: (courseId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    q.*, 
                    v.title as video_title,
                    c.title as chapter_title,
                    (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
                FROM quizzes q
                LEFT JOIN videos v ON q.video_id = v.id
                LEFT JOIN chapters c ON q.chapter_id = c.id
                WHERE q.course_id = ?
                ORDER BY q.created_at DESC
            `;
            
            db.query(query, [courseId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    submitQuizAttempt: (userId, quizId, answers) => {
        return new Promise((resolve, reject) => {
            const quizQuery = `
                SELECT 
                    q.id as quiz_id, 
                    q.passing_score,
                    qq.id as question_id,
                    qq.points,
                    qq.allows_multiple_correct,
                    qo.id as option_id,
                    qo.is_correct
                FROM quizzes q
                JOIN quiz_questions qq ON q.id = qq.quiz_id
                JOIN quiz_options qo ON qq.id = qo.question_id
                WHERE q.id = ? AND qo.is_correct = 1
            `;

            db.query(quizQuery, [quizId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                // Tính điểm
                let totalScore = 0;
                let maxScore = 0;
                const questionScores = new Map();

                // Nhóm các đáp án đúng theo câu hỏi
                results.forEach(row => {
                    if (!questionScores.has(row.question_id)) {
                        questionScores.set(row.question_id, {
                            points: row.points || 1,
                            correctOptions: new Set(),
                            allows_multiple_correct: row.allows_multiple_correct === 1
                        });
                    }
                    questionScores.get(row.question_id).correctOptions.add(row.option_id);
                });

                // Tính điểm cho từng câu hỏi
                questionScores.forEach((questionData, questionId) => {
                    maxScore += questionData.points;
                    const userAnswers = answers[questionId] || [];
                    const userAnswersSet = new Set(Array.isArray(userAnswers) ? userAnswers : [userAnswers]);
                    
                    if (questionData.allows_multiple_correct) {
                        // Với câu hỏi multiple choice, tất cả đáp án phải đúng
                        const isCorrect = 
                            userAnswersSet.size === questionData.correctOptions.size &&
                            [...userAnswersSet].every(answer => questionData.correctOptions.has(answer));
                        if (isCorrect) {
                            totalScore += questionData.points;
                        }
                    } else {
                        // Với câu hỏi single choice
                        if (userAnswersSet.size === 1 && 
                            questionData.correctOptions.has([...userAnswersSet][0])) {
                            totalScore += questionData.points;
                        }
                    }
                });

                const finalScore = Math.round((totalScore / maxScore) * 100);
                const passingScore = results[0]?.passing_score || 60;
                
                // Sửa lại logic xác định passed
                const passed = finalScore >= passingScore;
                const status = passed ? 'completed' : 'failed';

                resolve({
                    score: finalScore,
                    passed,
                    status,
                    answers
                });
            });
        });
    },

    getLatestAttempt: (userId, quizId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT qa.*, q.passing_score,
                       qq.id as question_id, qq.question_text, qq.points,
                       qo.id as option_id, qo.option_text, qo.is_correct,
                       qans.selected_option_id
                FROM quiz_attempts qa
                JOIN quizzes q ON qa.quiz_id = q.id
                JOIN quiz_questions qq ON q.id = qq.quiz_id
                JOIN quiz_options qo ON qq.id = qo.question_id
                LEFT JOIN quiz_answers qans ON qa.id = qans.attempt_id AND qq.id = qans.question_id
                WHERE qa.user_id = ? AND qa.quiz_id = ?
                ORDER BY qa.end_time DESC
                LIMIT 1
            `;

            db.query(query, [userId, quizId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                if (results.length === 0) {
                    resolve(null);
                    return;
                }

                // Tổ chức l liệu
                const questionMap = new Map();
                results.forEach(row => {
                    if (!questionMap.has(row.question_id)) {
                        questionMap.set(row.question_id, {
                            id: row.question_id,
                            question_text: row.question_text,
                            points: row.points,
                            options: [],
                            selected_answer: row.selected_option_id
                        });
                    }
                    questionMap.get(row.question_id).options.push({
                        id: row.option_id,
                        text: row.option_text,
                        is_correct: row.is_correct === 1
                    });
                });

                const details = Array.from(questionMap.values());
                const attempt = results[0];

                resolve({
                    score: attempt.score,
                    passed: attempt.status === 'completed',
                    attemptId: attempt.id,
                    details: details
                });
            });
        });
    },

    saveQuizAttempt: ({ userId, quizId, score, status }) => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO quiz_attempts 
                (user_id, quiz_id, score, status) 
                VALUES (?, ?, ?, ?)
            `;

            const values = [userId, quizId, score, status];

            db.query(query, values, (error, results) => {
                if (error) {
                    console.error("Error saving quiz attempt:", error);
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    createQuiz: (quizData) => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO quizzes 
                (title, duration_minutes, passing_score, teacher_id) 
                VALUES (?, ?, ?, ?)
            `;
            
            const values = [
                quizData.title,
                quizData.duration_minutes,
                quizData.passing_score,
                quizData.teacher_id
            ];

            db.query(query, values, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    addQuestionToQuiz: (quizId, questionData) => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO quiz_questions 
                (quiz_id, question_text, points, allows_multiple_correct) 
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                query,
                [
                    quizId,
                    questionData.question_text,
                    questionData.points,
                    questionData.allows_multiple_correct
                ],
                (error, results) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(results.insertId);
                }
            );
        });
    },

    addOptionsToQuestion: (questionId, options) => {
        return new Promise((resolve, reject) => {
            if (!options || options.length === 0) {
                resolve();
                return;
            }

            const query = `
                INSERT INTO quiz_options 
                (question_id, option_text, is_correct) 
                VALUES ?
            `;
            
            const values = options.map(option => [
                questionId,
                option.option_text,
                option.is_correct ? 1 : 0
            ]);

            db.query(query, [values], (error, results) => {
                if (error) {
                    console.error("Error adding options:", error);
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    deleteQuiz: (quizId) => {
        return new Promise((resolve, reject) => {
            // Xóa tất cả bằng một query với LEFT JOIN
            const query = `
                DELETE q, qq, qo
                FROM quizzes q
                LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
                LEFT JOIN quiz_options qo ON qq.id = qo.question_id
                WHERE q.id = ?
            `;

            db.query(query, [quizId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    getUnassignedQuizzes: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    q.*, 
                    (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
                FROM quizzes q
                WHERE q.video_id IS NULL 
                AND q.chapter_id IS NULL
                AND EXISTS (
                    SELECT 1 
                    FROM quiz_questions qq 
                    WHERE qq.quiz_id = q.id
                )
                ORDER BY q.created_at DESC
            `;
            
            db.query(query, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    assignQuiz: (quizId, { video_id, chapter_id }) => {
        return new Promise((resolve, reject) => {
            // Kiểm tra xem quiz có tồn tại không và lấy thông tin quiz
            db.query(
                `SELECT q.*, qq.id as has_questions, 
                 v.course_id as video_course_id, 
                 c.course_id as chapter_course_id 
                 FROM quizzes q
                 LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
                 LEFT JOIN videos v ON v.id = ?
                 LEFT JOIN chapters c ON c.id = ?
                 WHERE q.id = ?
                 LIMIT 1`,
                [video_id || null, chapter_id || null, quizId],
                (error, results) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (results.length === 0) {
                        reject(new Error('Quiz không tồn tại'));
                        return;
                    }

                    const quiz = results[0];

                    if (!quiz.has_questions) {
                        reject(new Error('Quiz chưa có câu hỏi nào'));
                        return;
                    }

                    const courseId = quiz.video_course_id || quiz.chapter_course_id;

                    if (!courseId) {
                        reject(new Error('Không tìm thấy thông tin khóa học'));
                        return;
                    }

                    // Cập nhật quiz
                    db.query(
                        'UPDATE quizzes SET video_id = ?, chapter_id = ?, course_id = ? WHERE id = ?',
                        [video_id || null, chapter_id || null, courseId, quizId],
                        (error, updateResults) => {
                            if (error) {
                                reject(error);
                                return;
                            }
                            resolve(updateResults);
                        }
                    );
                }
            );
        });
    },

    getAllQuizzes: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    q.id,
                    q.title,
                    q.duration_minutes,
                    q.passing_score,
                    q.quiz_type,
                    q.video_id,
                    q.teacher_id,
                    (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
                    v.title as video_title,
                    c.title as chapter_title,
                    t.full_name as teacher_name
                FROM quizzes q
                LEFT JOIN videos v ON q.video_id = v.id
                LEFT JOIN chapters c ON q.chapter_id = c.id
                LEFT JOIN users t ON q.teacher_id = t.id
                ORDER BY q.created_at DESC
            `;

            db.query(query, [], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    getAllQuizzesForVideo: (videoId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    q.*,
                    CASE 
                        WHEN q.video_id = ? THEN true 
                        ELSE false 
                    END as is_assigned,
                    (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
                    qq.id as question_id,
                    qq.question_text,
                    qq.points,
                    qo.id as option_id,
                    qo.option_text,
                    qo.is_correct
                FROM quizzes q
                LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
                LEFT JOIN quiz_options qo ON qq.id = qo.question_id
                WHERE (q.video_id IS NULL OR q.video_id = ?)
                AND q.quiz_type = 'video'
                AND EXISTS (
                    SELECT 1 
                    FROM quiz_questions qq2 
                    WHERE qq2.quiz_id = q.id
                )
                ORDER BY is_assigned DESC, q.created_at DESC
            `;
            
            db.query(query, [videoId, videoId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                // Chuyển đổi kết quả thành cấu trúc phân cấp
                const quizzes = [];
                const quizMap = new Map();

                results.forEach(row => {
                    if (!quizMap.has(row.id)) {
                        const quiz = {
                            id: row.id,
                            title: row.title,
                            duration_minutes: row.duration_minutes,
                            passing_score: row.passing_score,
                            quiz_type: row.quiz_type,
                            video_id: row.video_id,
                            chapter_id: row.chapter_id,
                            course_id: row.course_id,
                            is_assigned: row.is_assigned,
                            question_count: row.question_count,
                            questions: []
                        };
                        quizMap.set(row.id, quiz);
                        quizzes.push(quiz);
                    }

                    const quiz = quizMap.get(row.id);
                    
                    if (row.question_id) {
                        let question = quiz.questions.find(q => q.id === row.question_id);
                        if (!question) {
                            question = {
                                id: row.question_id,
                                question_text: row.question_text,
                                points: row.points,
                                options: []
                            };
                            quiz.questions.push(question);
                        }

                        if (row.option_id) {
                            question.options.push({
                                id: row.option_id,
                                option_text: row.option_text,
                                is_correct: row.is_correct === 1
                            });
                        }
                    }
                });

                resolve(quizzes);
            });
        });
    },

    unassignQuiz: (quizId) => {
        return new Promise((resolve, reject) => {
            db.query(
                'UPDATE quizzes SET video_id = NULL, chapter_id = NULL, course_id = NULL WHERE id = ?',
                [quizId],
                (error, results) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(results);
                }
            );
        });
    },

    getQuizById: (quizId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    q.*,
                    q.teacher_id,
                    qq.id as question_id,
                    qq.question_text,
                    qq.points,
                    qq.allows_multiple_correct,
                    qo.id as option_id,
                    qo.option_text,
                    qo.is_correct
                FROM quizzes q
                LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
                LEFT JOIN quiz_options qo ON qq.id = qo.question_id
                WHERE q.id = ?
                ORDER BY qq.id, qo.id
            `;

            db.query(query, [quizId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (results.length === 0) {
                    resolve(null);
                    return;
                }

                // Format dữ liệu thành cấu trúc phân cấp
                const quiz = {
                    id: results[0].id,
                    title: results[0].title,
                    duration_minutes: results[0].duration_minutes,
                    passing_score: results[0].passing_score,
                    quiz_type: results[0].quiz_type,
                    teacher_id: results[0].teacher_id,
                    questions: []
                };

                const questionsMap = new Map();

                results.forEach(row => {
                    if (row.question_id && !questionsMap.has(row.question_id)) {
                        questionsMap.set(row.question_id, {
                            id: row.question_id,
                            question_text: row.question_text,
                            points: row.points || 1,
                            allows_multiple_correct: row.allows_multiple_correct === 1,
                            options: []
                        });
                    }

                    if (row.question_id && row.option_id) {
                        const question = questionsMap.get(row.question_id);
                        question.options.push({
                            id: row.option_id,
                            option_text: row.option_text,
                            is_correct: row.is_correct === 1 ? true : false // Đảm bảo giá trị boolean
                        });
                    }
                });

                quiz.questions = Array.from(questionsMap.values());
                resolve(quiz);
            });
        });
    },

    getQuizResult: (userId, quizId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    qa.id as attempt_id,
                    qa.score,
                    qa.status as passed,
                    qa.quiz_id,
                    qans.question_id,
                    qans.selected_option_id as answer
                FROM quiz_attempts qa
                LEFT JOIN quiz_answers qans ON qa.id = qans.attempt_id
                WHERE qa.user_id = ? 
                AND qa.quiz_id = ?
                ORDER BY qa.end_time DESC
                LIMIT 1
            `;

            db.query(query, [userId, quizId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (results.length === 0) {
                    resolve(null);
                    return;
                }

                // Chuyển đổi kết quả thành cấu trúc phù hợp
                const quizResult = {
                    score: results[0].score,
                    passed: results[0].passed === 'completed',
                    answers: {}
                };

                // Nhóm các câu trả lời theo question_id
                results.forEach(row => {
                    if (row.question_id && row.answer) {
                        quizResult.answers[row.question_id] = row.answer;
                    }
                });

                resolve(quizResult);
            });
        });
    },

    resetQuizAttempt: (userId, quizId) => {
        return new Promise((resolve, reject) => {
            // Lấy attempt_id mới nhất
            const getLatestAttemptQuery = `
                SELECT id 
                FROM quiz_attempts 
                WHERE user_id = ? AND quiz_id = ? 
                ORDER BY end_time DESC 
                LIMIT 1
            `;

            db.query(getLatestAttemptQuery, [userId, quizId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (results.length === 0) {
                    resolve({ message: 'No attempt found' });
                    return;
                }

                const attemptId = results[0].id;

                // Xóa answers trước vì có khóa ngoại
                const deleteAnswersQuery = 'DELETE FROM quiz_answers WHERE attempt_id = ?';
                db.query(deleteAnswersQuery, [attemptId], (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    // Sau đó xóa attempt
                    const deleteAttemptQuery = 'DELETE FROM quiz_attempts WHERE id = ?';
                    db.query(deleteAttemptQuery, [attemptId], (error, results) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve(results);
                    });
                });
            });
        });
    },

    updateQuiz: (quizId, quizData) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE quizzes 
                SET title = ?, 
                    duration_minutes = ?, 
                    passing_score = ? 
                WHERE id = ?
            `;
            
            const values = [
                quizData.title,
                quizData.duration_minutes,
                quizData.passing_score,
                quizId
            ];

            db.query(query, values, (error, results) => {
                if (error) {
                    console.error("Error updating quiz:", error);
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    deleteQuizQuestions: (quizId) => {
        return new Promise((resolve, reject) => {
            // Xóa theo thứ tự để tránh vi phạm ràng buộc khóa ngoại
            const deleteOptionsQuery = `
                DELETE qo FROM quiz_options qo
                INNER JOIN quiz_questions qq ON qo.question_id = qq.id
                WHERE qq.quiz_id = ?
            `;
            
            const deleteQuestionsQuery = `
                DELETE FROM quiz_questions 
                WHERE quiz_id = ?
            `;

            // Thực hiện xóa options trước
            db.query(deleteOptionsQuery, [quizId], (error) => {
                if (error) {
                    console.error("Error deleting options:", error);
                    reject(error);
                    return;
                }

                // Sau đó xóa questions
                db.query(deleteQuestionsQuery, [quizId], (error, results) => {
                    if (error) {
                        console.error("Error deleting questions:", error);
                        reject(error);
                        return;
                    }
                    resolve(results);
                });
            });
        });
    },

    saveQuizAnswers: (attemptId, answers) => {
        return new Promise((resolve, reject) => {
            const values = [];
            
            Object.entries(answers).forEach(([questionId, selectedOptions]) => {
                // Chuyển đổi thành mảng nếu không phải
                const optionsArray = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions];
                
                // Tạo các cặp attempt_id, question_id, selected_option_id
                optionsArray.forEach(optionId => {
                    values.push([attemptId, parseInt(questionId), parseInt(optionId)]);
                });
            });

            if (values.length === 0) {
                resolve();
                return;
            }

            const query = `
                INSERT INTO quiz_answers 
                (attempt_id, question_id, selected_option_id) 
                VALUES ?
            `;

            db.query(query, [values], (error, results) => {
                if (error) {
                    console.error("Error saving quiz answers:", error);
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    getQuizzesByTeacher: (teacherId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    q.*,
                    v.title as video_title,
                    c.title as chapter_title,
                    COUNT(DISTINCT qq.id) as question_count
                FROM quizzes q
                LEFT JOIN videos v ON q.video_id = v.id
                LEFT JOIN chapters c ON q.chapter_id = c.id
                LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
                WHERE q.teacher_id = ?
                GROUP BY q.id
            `;

            db.query(query, [teacherId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    checkTeacherCourseAccess: (teacherId, courseId) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT 1 FROM courses WHERE id = ? AND teacher_id = ?';
            db.query(query, [courseId, teacherId], (error, results) => {
                if (error) reject(error);
                else resolve(results.length > 0);
            });
        });
    },

    checkTeacherQuizAccess: (teacherId, quizId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 1 FROM quizzes q
                JOIN courses c ON q.course_id = c.id
                WHERE q.id = ? AND c.teacher_id = ?
            `;
            db.query(query, [quizId, teacherId], (error, results) => {
                if (error) reject(error);
                else resolve(results.length > 0);
            });
        });
    },

    updateQuestion: (questionId, questionData) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE quiz_questions 
                SET 
                    question_text = ?,
                    points = ?,
                    allows_multiple_correct = ?
                WHERE id = ?
            `;

            db.query(
                query,
                [
                    questionData.question_text,
                    questionData.points,
                    questionData.allows_multiple_correct,
                    questionId
                ],
                (error, results) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(results);
                }
            );
        });
    },

    deleteQuestionOptions: (questionId) => {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM quiz_options WHERE question_id = ?';
            
            db.query(query, [questionId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    addOptionsToQuestion: (questionId, options) => {
        return new Promise((resolve, reject) => {
            const values = options.map(opt => [
                questionId,
                opt.option_text,
                opt.is_correct
            ]);

            const query = `
                INSERT INTO quiz_options 
                (question_id, option_text, is_correct) 
                VALUES ?
            `;

            db.query(query, [values], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    getQuizQuestions: (quizId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    qq.*,
                    qo.id as option_id,
                    qo.option_text,
                    qo.is_correct
                FROM quiz_questions qq
                LEFT JOIN quiz_options qo ON qq.id = qo.question_id
                WHERE qq.quiz_id = ?
                ORDER BY qq.id, qo.id
            `;

            db.query(query, [quizId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                // Format data
                const questions = new Map();

                results.forEach(row => {
                    if (!questions.has(row.id)) {
                        questions.set(row.id, {
                            id: row.id,
                            question_text: row.question_text,
                            points: row.points || 1,
                            allows_multiple_correct: row.allows_multiple_correct === 1,
                            options: []
                        });
                    }

                    if (row.option_id) {
                        const question = questions.get(row.id);
                        question.options.push({
                            id: row.option_id,
                            option_text: row.option_text,
                            is_correct: row.is_correct === 1
                        });
                    }
                });

                resolve(Array.from(questions.values()));
            });
        });
    },

    getAvailableQuizzesForVideo: (videoId, teacherId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    q.id,
                    q.title,
                    q.duration_minutes,
                    q.passing_score,
                    q.quiz_type,
                    v.title as video_title,
                    c.title as chapter_title,
                    (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
                    CASE 
                        WHEN q.video_id = ? THEN true 
                        ELSE false 
                    END as is_assigned
                FROM quizzes q
                LEFT JOIN videos v ON q.video_id = v.id
                LEFT JOIN chapters c ON q.chapter_id = c.id
                WHERE 
                    q.teacher_id = ?
                    AND (q.video_id IS NULL OR q.video_id = ?)
                ORDER BY q.created_at DESC
            `;

            db.query(query, [videoId, teacherId, videoId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },

    assignQuizToVideo: (quizId, videoId) => {
        return new Promise((resolve, reject) => {
            // Đầu tiên lấy course_id từ video
            const getCourseQuery = `
                SELECT course_id FROM videos WHERE id = ?
            `;

            db.query(getCourseQuery, [videoId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                const courseId = results[0]?.course_id;
                const chapterId = results[0]?.chapter_id;
                if (!courseId) {
                    reject(new Error('Không tìm thấy thông tin khóa học của video'));
                    return;
                }

                // Sau đó cập nhật quiz với cả video_id và course_id
                const updateQuery = `
                    UPDATE quizzes 
                    SET video_id = ?, chapter_id = ?, course_id = ?
                    WHERE id = ?
                `;

                db.query(updateQuery, [videoId, chapterId, courseId, quizId], (error, results) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(results);
                });
            });
        });
    },

    unassignQuizFromVideo: (quizId, videoId) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE quizzes 
                SET video_id = NULL, course_id = NULL
                WHERE id = ? AND video_id = ?
            `;

            db.query(query, [quizId, videoId], (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    }
};

module.exports = quiz;