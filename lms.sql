SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE chapters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT,
  title VARCHAR(255) DEFAULT NULL,
  order_index INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  thumbnail VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_public TINYINT(1) DEFAULT 0,
  teacher_id INT,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role ENUM('admin','student','teacher') DEFAULT 'student',
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  avatar VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE videos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  course_id INT NOT NULL,
  video_url VARCHAR(255) NOT NULL,
  chapter_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE video_completion (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  video_id INT NOT NULL,
  is_completed TINYINT(1) DEFAULT 0,
  UNIQUE KEY user_video (user_id, video_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tạo bảng course_enrollments để thống kê
CREATE TABLE course_enrollments (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) NOT NULL,
  course_id int(11) NOT NULL,
  enrolled_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY unique_enrollment (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE quizzes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  course_id INT,
  chapter_id INT,
  video_id INT,
  duration_minutes INT DEFAULT 30,
  passing_score INT DEFAULT 60,
  quiz_type ENUM('video', 'chapter') DEFAULT 'video',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  teacher_id INT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE quiz_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  points INT DEFAULT 1,
  allows_multiple_correct TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE quiz_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE quiz_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score INT NOT NULL,
  status ENUM('completed', 'failed') NOT NULL,
  end_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE quiz_answers (
  id int(11) NOT NULL AUTO_INCREMENT,
  attempt_id int(11) NOT NULL,
  question_id int(11) NOT NULL,
  selected_option_id int(11) NOT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY attempt_id (attempt_id),
  KEY question_id (question_id),
  KEY selected_option_id (selected_option_id),
  CONSTRAINT quiz_answers_ibfk_1 FOREIGN KEY (attempt_id) REFERENCES quiz_attempts (id),
  CONSTRAINT quiz_answers_ibfk_2 FOREIGN KEY (question_id) REFERENCES quiz_questions (id),
  CONSTRAINT quiz_answers_ibfk_3 FOREIGN KEY (selected_option_id) REFERENCES quiz_options (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Bảng chứa các tag môn học/chủ đề
CREATE TABLE quiz_tags (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(50) NOT NULL,
  type ENUM('subject', 'topic', 'skill', 'level') NOT NULL,
  description TEXT,
  parent_id int(11) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY name_type (name, type),
  FOREIGN KEY (parent_id) REFERENCES quiz_tags(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Bảng liên kết quiz với tags
CREATE TABLE quiz_tag_relations (
  quiz_id int(11) NOT NULL,
  tag_id int(11) NOT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (quiz_id, tag_id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES quiz_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  course_id INT NOT NULL,
  chapter_id INT,
  video_id INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  teacher_id INT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Bảng lớp học
CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id INT NOT NULL,
    class_code VARCHAR(10) UNIQUE NOT NULL,  -- Mã lớp học unique
    password VARCHAR(255) DEFAULT NULL,       -- Mật khẩu để tham gia (có thể NULL)
    requires_password BOOLEAN DEFAULT FALSE,  -- Flag xác định có yêu cầu mật khẩu không
    status ENUM('active', 'inactive') DEFAULT 'active',
    max_students INT DEFAULT 100,
    thumbnail VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Bảng trung gian liên kết giữa lớp học và khóa học
CREATE TABLE class_courses (
    class_id INT,
    course_id INT,
    requires_approval BOOLEAN DEFAULT FALSE,  -- Thêm flag yêu cầu phê duyệt
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, course_id)
);

-- Bảng học sinh trong lớp và trạng thái với từng khóa học
CREATE TABLE class_students_courses_approval (
    class_id INT,
    student_id INT,
    course_id INT,
    status ENUM('pending', 'approved', 'rejected', 'blocked') DEFAULT 'pending',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, student_id, course_id)
);

-- Bảng học sinh trong lớp (giữ nguyên)
CREATE TABLE class_students (
    class_id INT,
    student_id INT,
    status ENUM('pending', 'active', 'blocked') DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, student_id)
);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
