SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE chapters (
  id int(11) NOT NULL,
  course_id int(11) DEFAULT NULL,
  title varchar(255) DEFAULT NULL,
  order_index int(11) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE courses (
  id int(11) NOT NULL,
  title varchar(200) NOT NULL,
  description text DEFAULT NULL,
  thumbnail varchar(255) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  is_public TINYINT(1) DEFAULT 0,
  teacher_id int(11)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE users (
  id int(11) NOT NULL,
  username varchar(50) NOT NULL,
  email varchar(100) NOT NULL,
  password varchar(255) NOT NULL,
  full_name varchar(100) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  role enum('admin','student','teacher') DEFAULT 'student',
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE videos (
  id int(11) NOT NULL,
  title varchar(200) NOT NULL,
  course_id int(11) NOT NULL,
  video_url varchar(255) NOT NULL,
  chapter_id int(11) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE video_completion (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) NOT NULL,
  video_id int(11) NOT NULL,
  is_completed TINYINT(1) DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY user_video (user_id, video_id),
  CONSTRAINT video_completion_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT video_completion_ibfk_2 FOREIGN KEY (video_id) REFERENCES videos (id)
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
  id int(11) NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  course_id int(11) DEFAULT NULL,
  chapter_id int(11) DEFAULT NULL,
  video_id int(11) DEFAULT NULL,
  duration_minutes int(11) DEFAULT 30,
  passing_score int(11) DEFAULT 60,
  quiz_type ENUM('video', 'chapter') NOT NULL DEFAULT 'video',
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  teacher_id int(11) NOT NULL,
  PRIMARY KEY (id),
  KEY course_id (course_id),
  KEY chapter_id (chapter_id),
  KEY video_id (video_id),
  CONSTRAINT quizzes_ibfk_1 FOREIGN KEY (course_id) REFERENCES courses (id),
  CONSTRAINT quizzes_ibfk_2 FOREIGN KEY (chapter_id) REFERENCES chapters (id),
  CONSTRAINT quizzes_ibfk_3 FOREIGN KEY (video_id) REFERENCES videos (id),
  CONSTRAINT quizzes_ibfk_4 FOREIGN KEY (teacher_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE quiz_questions (
  id int(11) NOT NULL AUTO_INCREMENT,
  quiz_id int(11) NOT NULL,
  question_text text NOT NULL,
  points int(11) DEFAULT 1,
  allows_multiple_correct TINYINT(1) DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY quiz_id (quiz_id),
  CONSTRAINT quiz_questions_ibfk_1 FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE quiz_options (
  id int(11) NOT NULL AUTO_INCREMENT,
  question_id int(11) NOT NULL,
  option_text TEXT NOT NULL,
  is_correct TINYINT(1) DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY question_id (question_id),
  CONSTRAINT quiz_options_ibfk_1 FOREIGN KEY (question_id) REFERENCES quiz_questions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE quiz_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score INT NOT NULL,
  status ENUM('completed', 'failed') NOT NULL,
  end_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
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
  id int(11) NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  file_path varchar(255) NOT NULL,
  file_type varchar(50) NOT NULL,
  course_id int(11) NOT NULL,
  chapter_id int(11) DEFAULT NULL,
  video_id int(11) DEFAULT NULL,
  uploaded_at timestamp NOT NULL DEFAULT current_timestamp(),
  teacher_id int(11) NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  FOREIGN KEY (video_id) REFERENCES videos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE chapters
  ADD PRIMARY KEY (id),
  ADD KEY course_id (course_id);

ALTER TABLE courses
  ADD PRIMARY KEY (id);

ALTER TABLE users
  ADD PRIMARY KEY (id),
  ADD UNIQUE KEY username (username),
  ADD UNIQUE KEY email (email);

ALTER TABLE videos
  ADD PRIMARY KEY (id),
  ADD KEY course_id (course_id),
  ADD KEY chapter_id (chapter_id);


ALTER TABLE chapters
  MODIFY id int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE courses
  MODIFY id int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE users
  MODIFY id int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE videos
  MODIFY id int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE chapters
  ADD CONSTRAINT chapters_ibfk_1 FOREIGN KEY (course_id) REFERENCES courses (id);

ALTER TABLE videos
  ADD CONSTRAINT videos_ibfk_1 FOREIGN KEY (course_id) REFERENCES courses (id),
  ADD CONSTRAINT videos_ibfk_2 FOREIGN KEY (chapter_id) REFERENCES chapters (id);

ALTER TABLE courses
  ADD FOREIGN KEY (teacher_id) REFERENCES users(id);

ALTER TABLE users 
  ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN verification_token VARCHAR(255);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
